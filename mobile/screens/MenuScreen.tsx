import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../components/Buttons';
import Checkbox from '../components/Checkbox';
import { CtaBar, Header, StepIndicator, Step } from '../components/Chrome';
import { CheckMark } from '../components/Glyphs';
import { ScreenEntrance, Shake } from '../components/Motion';
import { pendingFor } from '../lib/shopping';
import { fonts, radii, Theme } from '../theme';

export type Meal = {
  name: string;
  description: string;
  ingredientsUsed: string[];
  ingredientsToBuy: string[];
};

type Props = {
  theme: Theme;
  onOpenProfile: () => void;
  enabledSteps: Step[];
  onGoTo: (step: Step) => void;
  profileName: string;
  profileEmail: string;

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
          onOpenProfile={props.onOpenProfile}
          profileName={props.profileName}
          profileEmail={props.profileEmail}
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
                      <Text style={styles.readyLabel}>Listo para cocinar</Text>
                    </View>
                  );
                }
                // Lo que falta va como píldoras, no como lista separada por comas:
                // se leen de un vistazo parado en el almacén.
                return (
                  <View style={styles.missingWrap}>
                    {pending.map((item) => (
                      <View key={item} style={styles.missingPill}>
                        <Text style={styles.missingPillText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                );
              })()}

              {on && (
                <View style={styles.actions}>
                  <Pressable onPress={() => props.onOpenRecipe(i)} style={styles.recipeBtn}>
                    <Text style={styles.recipeBtnText}>Ver receta</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => props.onRegenerate(i)}
                    disabled={props.regeneratingIndex !== null}
                    style={styles.regenBtn}
                  >
                    {regenerating && <ActivityIndicator size="small" color={theme.inkSoft} />}
                    {/* No anuncia que puede costar un anuncio: eso convertiría
                        cada tarjeta en un recordatorio de que no pagaste. El
                        costo aparece al tocar, cuando ya decidiste. */}
                    <Text style={styles.regenBtnText}>
                      {regenerating ? 'Cambiando…' : props.regenCounts[i] ? 'Otra más' : 'Otra'}
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
          title="Ver lista de compras"
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
      fontFamily: fonts.displaySemi,
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
      fontFamily: fonts.bodyMedium,
      fontSize: 13.5,
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
      fontSize: 12.5,
      color: theme.accent,
    },
    mealName: {
      fontFamily: fonts.displaySemi,
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
    missingWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 11,
    },
    missingPill: {
      paddingVertical: 5,
      paddingHorizontal: 11,
      borderRadius: radii.chip,
      backgroundColor: theme.line14,
    },
    missingPillText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 12.5,
      color: theme.ink,
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
      fontSize: 13,
      color: theme.accent,
    },
    actions: { flexDirection: 'row', gap: 8 },
    recipeBtn: {
      flex: 1,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radii.btnSecondary,
      backgroundColor: theme.accent,
    },
    recipeBtnText: {
      fontFamily: fonts.bodySemi,
      fontSize: 13,
      color: theme.accentInk,
    },
    regenBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      minHeight: 44,
      paddingHorizontal: 16,
      borderRadius: radii.btnSecondary,
      borderWidth: 1,
      borderColor: theme.line20,
    },
    regenBtnText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: theme.ink,
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
