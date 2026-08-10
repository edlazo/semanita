import { Fragment, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HatchPattern } from './Motion';
import { fonts, Theme } from '../theme';

/** Compras dejó de ser un paso: ahora es una pestaña. */
export type Step = 1 | 2;

const STEP_LABELS: Record<Step, string> = {
  1: 'Ingredientes',
  2: 'Menú',
};

type HeaderProps = {
  theme: Theme;
  onOpenProfile?: () => void;
  profileName?: string;
  profileEmail?: string;
};

export function Header({
  theme,
  onOpenProfile,
  profileName = '',
  profileEmail = '',
}: HeaderProps) {
  const styles = getStyles(theme);
  return (
    <View style={styles.header}>
      <Text style={styles.brand}>Semanita</Text>
      {/* Solo la marca y el avatar. El cambio de modo y el reinicio de la
          semana viven en el Perfil: acá competían con el contenido. */}
      {onOpenProfile && (
        <Avatar theme={theme} name={profileName} email={profileEmail} onPress={onOpenProfile} />
      )}
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

  // El paso en curso lleva su número; los otros llevan una flecha que apunta a
  // dónde te deja tocarlos. Volver es acento, seguir es tinta.
  const renderStep = (step: Step) => {
    const label = STEP_LABELS[step];
    if (step === current) {
      return (
        <View style={styles.stepCurrent}>
          <Text style={styles.stepNumber}>{step}</Text>
          <Text style={styles.stepLabel}>{label}</Text>
        </View>
      );
    }

    const reachable = enabled.includes(step);
    const back = step < current;
    return (
      <Pressable
        onPress={reachable ? () => onGoTo(step) : undefined}
        disabled={!reachable}
        hitSlop={8}
        style={[styles.step, !reachable && styles.stepInactive]}
      >
        {back && <Text style={styles.stepArrowBack}>←</Text>}
        <Text style={back ? styles.stepLabelBack : styles.stepLabelAhead}>{label}</Text>
        {!back && <Text style={styles.stepArrowAhead}>→</Text>}
      </Pressable>
    );
  };

  return (
    <View style={styles.steps}>
      {steps.map((step, i) => (
        <Fragment key={step}>
          {/* La línea se estira: los dos pasos quedan pegados a los bordes. */}
          {i > 0 && <View style={styles.stepLine} />}
          {renderStep(step)}
        </Fragment>
      ))}
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

  const inner = (
    <>
      <HatchPattern ph1={theme.ph1} ph2={theme.ph2} />
      <Text style={text}>{label}</Text>
    </>
  );

  if (!onPress) return <View style={circle}>{inner}</View>;
  return (
    <Pressable onPress={onPress} hitSlop={8} style={circle} accessibilityLabel="Abrir tu perfil">
      {inner}
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
  metaTone = 'soft',
  onMeta,
  rule,
}: {
  theme: Theme;
  children: string;
  meta?: string;
  /** El conteo va en acento; una nota al margen, apagada. */
  metaTone?: 'soft' | 'accent';
  onMeta?: () => void;
  rule?: 'soft' | 'accent';
}) {
  const styles = getStyles(theme);
  const metaStyle = [styles.eyebrowMeta, metaTone === 'accent' && styles.eyebrowMetaAccent];
  return (
    <View
      style={[
        styles.eyebrowRow,
        rule === 'soft' && styles.eyebrowRuleSoft,
        rule === 'accent' && styles.eyebrowRuleAccent,
      ]}
    >
      <Text style={styles.eyebrowText}>{children}</Text>
      {meta &&
        (onMeta ? (
          <Pressable onPress={onMeta} hitSlop={8}>
            <Text style={metaStyle}>{meta}</Text>
          </Pressable>
        ) : (
          <Text style={metaStyle}>{meta}</Text>
        ))}
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
    brand: {
      fontFamily: fonts.bodyBold,
      fontSize: 16,
      letterSpacing: -0.32,
      color: theme.ink,
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
    stepLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.line26,
    },
    stepCurrent: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 6,
    },
    step: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    // Un paso sin datos todavía no lleva a ningún lado.
    stepInactive: {
      opacity: 0.4,
    },
    stepNumber: {
      fontFamily: fonts.bodySemi,
      fontSize: 13,
      color: theme.accent,
    },
    stepLabel: {
      fontFamily: fonts.bodySemi,
      fontSize: 13,
      color: theme.ink,
    },
    stepLabelBack: {
      fontFamily: fonts.bodySemi,
      fontSize: 13,
      color: theme.accent,
    },
    stepArrowBack: {
      fontFamily: fonts.bodyMedium,
      fontSize: 14,
      color: theme.accent,
    },
    stepLabelAhead: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: theme.ink,
    },
    stepArrowAhead: {
      fontFamily: fonts.bodyMedium,
      fontSize: 14,
      color: theme.ink,
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
      // Sin padding vertical: cualquier relleno lo vuelve elíptico.
      overflow: 'hidden',
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
      fontSize: 12.5,
      color: theme.inkSoft,
    },
    eyebrowMetaAccent: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: theme.accent,
    },
  });
}
