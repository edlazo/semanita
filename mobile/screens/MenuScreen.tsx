import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../components/Buttons';
import Checkbox from '../components/Checkbox';
import { useState } from 'react';
import { CtaBar, Eyebrow, Header, StepIndicator, Step } from '../components/Chrome';
import { Chevron } from '../components/Icons';
import { ALL_MOMENTS } from '../lib/moments';
import { ScreenEntrance, Shake } from '../components/Motion';
import { pendingFor } from '../lib/shopping';
import { fonts, radii, Theme } from '../theme';

export type Meal = {
  name: string;
  description: string;
  ingredientsUsed: string[];
  ingredientsToBuy: string[];
  /** Los manda el backend. Con varios momentos el índice ya no dice el día. */
  day: string;
  moment: string;
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

  // El backend devuelve las comidas por momento (todos los desayunos, después
  // todos los almuerzos), así que hay que reagrupar de verdad, no por
  // consecutivos. El índice original se conserva porque todo lo demás —tildar,
  // regenerar, la lista de compras— sigue hablando por índice.
  const groups = new Map<string, { meal: Meal; index: number }[]>();
  meals.forEach((meal, index) => {
    const bucket = groups.get(meal.day);
    if (bucket) bucket.push({ meal, index });
    else groups.set(meal.day, [{ meal, index }]);
  });

  const orderOf = (value: string, list: readonly string[]) => {
    const i = list.indexOf(value);
    return i === -1 ? list.length : i;
  };

  const byDay = [...groups.entries()]
    .map(([day, items]) => ({
      day,
      items: [...items].sort(
        (a, b) => orderOf(a.meal.moment, ALL_MOMENTS) - orderOf(b.meal.moment, ALL_MOMENTS)
      ),
    }))
    .sort((a, b) => orderOf(a.day, props.days) - orderOf(b.day, props.days));

  // Con un momento son 7 tarjetas y entran de corrido; con cuatro son 28 y la
  // pantalla se vuelve un scroll interminable. Ahí se pliega el día entero: la
  // tarjeta queda intacta y la semana pasa a ser siete filas.
  const collapsible = new Set(meals.map((m) => m.moment)).size > 1;
  const [openDays, setOpenDays] = useState<Set<string>>(
    // El primer día arranca abierto: con todo plegado la pantalla se ve vacía
    // justo después de generar, y no se entiende que las filas se abren.
    () => new Set(byDay.length ? [byDay[0].day] : [])
  );

  function toggleDay(day: string) {
    setOpenDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

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

        {byDay.map((group) => {
          const openDay = !collapsible || openDays.has(group.day);
          const chosen = group.items.filter(({ index }) => selected.has(index)).length;
          return (
          <View key={group.day} style={styles.dayGroup}>
            {/* El día encabeza la sección; adentro va una tarjeta por momento.
                Con un solo momento queda igual que antes: un día, una comida. */}
            {collapsible ? (
              <Pressable onPress={() => toggleDay(group.day)} style={styles.dayHeader}>
                <Text style={styles.dayHeaderText}>{group.day}</Text>
                {/* Plegado hay que poder saber qué hay adentro sin abrirlo. */}
                <Text style={styles.dayHeaderMeta}>
                  {chosen} de {group.items.length}
                </Text>
                <View style={openDay ? styles.chevronOpen : undefined}>
                  <Chevron size={14} color={theme.inkSoft} />
                </View>
              </Pressable>
            ) : (
              <Eyebrow theme={theme} rule="soft">
                {group.day}
              </Eyebrow>
            )}

            {openDay && group.items.map(({ meal, index: i }) => {
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
                    <Text style={styles.day}>{meal.moment}</Text>
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
                // Una comida descartada no pide nada: sus faltantes ya salieron
                // de la lista de compras, así que seguir mostrándolos prometía
                // una compra que la lista no iba a pedir. Y como el tachado se
                // calcula contra la lista, un ingrediente compartido con otro
                // día hacía que la píldora de la descartada cambiara sola.
                if (!on) return null;

                const pending = pendingFor(meal.ingredientsToBuy, props.checkedNames);
                // "Listo para cocinar" solo si alguna vez hubo algo que comprar:
                // sin faltantes felicitaría por una compra que no hiciste.
                if (meal.ingredientsToBuy.length > 0 && pending.length === 0) {
                  return (
                    <View style={styles.readyRow}>
                      {/* La misma casilla del encabezado, no un ✓ dibujado
                          aparte: dos medidas distintas se leían como dos
                          tipografías. */}
                      <Checkbox checked size={20} theme={theme} />
                      <Text style={styles.readyLabel}>Listo para cocinar</Text>
                    </View>
                  );
                }
                if (pending.length === 0) return null;
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
    dayGroup: { marginBottom: 14 },
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
    // Mismo peso y filete que el Eyebrow, para que plegable y no plegable se
    // vean como la misma pantalla.
    dayHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: 44,
      paddingBottom: 6,
      marginBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.line26,
    },
    dayHeaderText: {
      flex: 1,
      fontFamily: fonts.bodySemi,
      fontSize: 15,
      letterSpacing: -0.15,
      color: theme.ink,
    },
    dayHeaderMeta: {
      fontFamily: fonts.body,
      fontSize: 12.5,
      color: theme.inkSoft,
    },
    // El chevron apunta abajo cuando el día está abierto.
    chevronOpen: { transform: [{ rotate: '90deg' }] },
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
      gap: 9,
      alignItems: 'center',
      marginBottom: 11,
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
