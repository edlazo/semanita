import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../components/Buttons';
import Checkbox from '../components/Checkbox';
import { CtaBar, Header, StepIndicator, Step } from '../components/Chrome';
import { CheckMark } from '../components/Glyphs';
import { ScreenEntrance, Shake } from '../components/Motion';
import { pendingFor } from '../lib/shopping';
import { fonts, radii, Mode, Theme } from '../theme';

export type Meal = {
  name: string;
  description: string;
  ingredientsUsed: string[];
  ingredientsToBuy: string[];
};

type Props = {
  theme: Theme;
  mode: Mode;
  toggleMode: () => void;
  onNewWeek: () => void;
  onOpenProfile: () => void;
  enabledSteps: Step[];
  onGoTo: (step: Step) => void;
  planLabel?: string | null;
  /** Sin suscripción, regenerar pide ver un anuncio: el botón lo anuncia. */
  regenNeedsAd: boolean;

  meals: Meal[];
  days: string[];
  selected: Set<number>;
  regenCounts: Record<number, number>;
  regeneratingIndex: number | null;
  onToggleMeal: (index: number) => void;
  onRegenerate: (index: number) => void;
  onOpenRecipe: (index: number) => void;

  /** Ingredientes ya tachados en la lista de compras, normalizados. */
  checkedNames: Set<string>;

  error: string | null;
  shoppingLoading: boolean;
  itemCount: number;
  onGoShopping: () => void;
};

export default function MenuScreen(props: Props) {
  const { theme, meals, selected } = props;
  const styles = getStyles(theme);

  return (
    <ScreenEntrance style={styles.root}>
      <View style={styles.top}>
        <Header
          theme={theme}
          mode={props.mode}
          toggleMode={props.toggleMode}
          actionLabel="SEMANA NUEVA"
          onAction={props.onNewWeek}
          planLabel={props.planLabel}
          onOpenProfile={props.onOpenProfile}
        />
        <StepIndicator theme={theme} current={2} enabled={props.enabledSteps} onGoTo={props.onGoTo} />

        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Tu semana</Text>
            <Text style={styles.subtitle}>
              {selected.size} de {meals.length} elegidas · destildá lo que no querés
            </Text>
          </View>
          <Text style={styles.counter}>
            {selected.size} de {meals.length}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollBody}>
        {props.error && (
          <Shake trigger={props.error}>
            <Text style={styles.error}>{props.error}</Text>
          </Shake>
        )}

        {meals.map((meal, i) => {
          const on = selected.has(i);
          const regenerating = props.regeneratingIndex === i;
          return (
            <View
              key={`${meal.name}-${i}`}
              style={[
                styles.card,
                on
                  ? { backgroundColor: theme.surface, borderColor: theme.line20 }
                  : styles.cardOff,
                !on && { borderColor: theme.border },
              ]}
            >
              <View style={styles.cardTop}>
                <Text style={styles.day}>{props.days[i] ?? ''}</Text>
                <Checkbox
                  checked={on}
                  onPress={() => props.onToggleMeal(i)}
                  size={22}
                  theme={theme}
                />
              </View>

              <Text style={[styles.mealName, !on && styles.mealNameOff]}>{meal.name}</Text>
              <Text style={styles.mealDesc}>{meal.description}</Text>

              {(() => {
                const pending = pendingFor(meal.ingredientsToBuy, props.checkedNames);
                if (pending.length === 0) {
                  return (
                    <View style={styles.readyRow}>
                      <View style={styles.readyBadge}>
                        <CheckMark size={12} color={theme.accentInk} thickness={1.5} />
                      </View>
                      <Text style={styles.readyLabel}>LISTO PARA COCINAR</Text>
                    </View>
                  );
                }
                return (
                  <View style={styles.missingRow}>
                    <Text style={styles.missingLabel}>FALTA</Text>
                    <Text style={styles.missingText}>{pending.join(', ')}</Text>
                  </View>
                );
              })()}

              {on && (
                <View style={styles.actions}>
                  <Pressable onPress={() => props.onOpenRecipe(i)} hitSlop={8}>
                    <Text style={styles.recipeAction}>VER RECETA</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => props.onRegenerate(i)}
                    disabled={props.regeneratingIndex !== null}
                    hitSlop={8}
                    style={styles.regenWrap}
                  >
                    {regenerating && <ActivityIndicator size="small" color={theme.inkSoft} />}
                    <Text style={styles.regenAction}>
                      {regenerating
                        ? 'REGENERANDO…'
                        : props.regenNeedsAd
                          ? 'REGENERAR · VER ANUNCIO'
                          : (props.regenCounts[i] ?? 0) > 0
                            ? 'REGENERAR OTRA VEZ'
                            : 'REGENERAR'}
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <CtaBar theme={theme}>
        <PrimaryButton
          title="VER LISTA DE COMPRAS"
          meta={`${props.itemCount} ${props.itemCount === 1 ? 'ítem' : 'ítems'}`}
          onPress={props.onGoShopping}
          loading={props.shoppingLoading}
          disabled={selected.size === 0}
          theme={theme}
        />
      </CtaBar>
    </ScreenEntrance>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg, paddingTop: 52 },
    top: { paddingHorizontal: 26 },
    scroll: { flex: 1 },
    scrollBody: { paddingHorizontal: 26, paddingBottom: 104 },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginTop: 12,
      marginBottom: 10,
      gap: 12,
    },
    titleBlock: { flexShrink: 1 },
    title: {
      fontFamily: fonts.display,
      fontSize: 27,
      lineHeight: 29,
      letterSpacing: -0.4,
      color: theme.ink,
    },
    subtitle: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: theme.inkSoft,
      marginTop: 3,
    },
    counter: {
      fontFamily: fonts.displayItalic,
      fontSize: 13,
      color: theme.accent,
    },
    card: {
      borderRadius: radii.card,
      borderWidth: 1,
      paddingTop: 13,
      paddingHorizontal: 16,
      paddingBottom: 12,
      marginBottom: 9,
    },
    // Descartada: sin papel, borde punteado y atenuada.
    cardOff: {
      backgroundColor: 'transparent',
      borderStyle: 'dashed',
      opacity: 0.6,
    },
    cardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 9,
    },
    day: {
      fontFamily: fonts.bodySemi,
      fontSize: 9.5,
      letterSpacing: 1.9,
      color: theme.accent,
    },
    mealName: {
      fontFamily: fonts.display,
      fontSize: 20,
      lineHeight: 24,
      color: theme.ink,
      marginBottom: 7,
    },
    mealNameOff: {
      color: theme.inkSoft,
      textDecorationLine: 'line-through',
    },
    mealDesc: {
      fontFamily: fonts.body,
      fontSize: 13.5,
      lineHeight: 21,
      color: theme.inkSoft,
      marginBottom: 9,
    },
    missingRow: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'baseline',
      paddingVertical: 7,
      borderTopWidth: 1,
      borderTopColor: theme.line20,
    },
    missingLabel: {
      fontFamily: fonts.bodySemi,
      fontSize: 9,
      letterSpacing: 1.44,
      color: theme.accent,
    },
    missingText: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: theme.ink,
      flexShrink: 1,
    },
    readyRow: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      paddingVertical: 7,
      borderTopWidth: 1,
      borderTopColor: theme.line20,
    },
    readyBadge: {
      width: 18,
      height: 18,
      flexShrink: 0,
      borderRadius: radii.chip,
      backgroundColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    readyLabel: {
      fontFamily: fonts.bodySemi,
      fontSize: 9.5,
      letterSpacing: 1.9,
      color: theme.accent,
    },
    actions: {
      flexDirection: 'row',
      gap: 18,
      alignItems: 'center',
      paddingTop: 7,
      borderTopWidth: 1,
      borderTopColor: theme.line20,
    },
    recipeAction: {
      fontFamily: fonts.bodySemi,
      fontSize: 11,
      letterSpacing: 1.1,
      color: theme.ink,
      borderBottomWidth: 1,
      borderBottomColor: theme.accent,
      paddingBottom: 2,
    },
    regenWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    regenAction: {
      fontFamily: fonts.bodyMedium,
      fontSize: 11,
      letterSpacing: 1.1,
      color: theme.inkSoft,
    },
    error: {
      fontFamily: fonts.body,
      fontSize: 13,
      lineHeight: 19,
      color: theme.accent,
      marginBottom: 12,
    },
  });
}
