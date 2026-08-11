import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Cross } from './Icons';
import { fonts, radii, Theme } from '../theme';

export type RecipeIngredient = {
  name: string;
  qty: string;
};

export type Recipe = {
  servings: string;
  time: string;
  difficulty: string;
  ingredients: RecipeIngredient[];
  steps: string[];
};

type Props = {
  visible: boolean;
  onClose: () => void;
  mealName: string;
  /** Día de la semana de la comida, para el eyebrow "RECETA · LUNES". */
  day?: string;
  recipe: Recipe | null;
  loading: boolean;
  error: string | null;
  theme: Theme;
};

export default function RecipeModal({
  visible,
  onClose,
  mealName,
  day,
  recipe,
  loading,
  error,
  theme,
}: Props) {
  const styles = getStyles(theme);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <View style={styles.sheet}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>{day ? `Receta · ${day}` : 'Receta'}</Text>
            <Text style={styles.title}>{mealName}</Text>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={styles.closeBtn}
            accessibilityLabel="Cerrar receta"
          >
            <Cross size={24} color={theme.ink} strokeWidth={1.5} />
          </Pressable>
        </View>

        {recipe && (
          <View style={styles.metaStrip}>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Porciones</Text>
              <Text style={styles.metaValue}>{recipe.servings}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={[styles.metaCell, styles.metaCellPadded]}>
              <Text style={styles.metaLabel}>Tiempo</Text>
              <Text style={styles.metaValue}>{recipe.time}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={[styles.metaCell, styles.metaCellPadded]}>
              <Text style={styles.metaLabel}>Dificultad</Text>
              <Text style={styles.metaValue}>{recipe.difficulty}</Text>
            </View>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.body}>
          {loading && <ActivityIndicator size="large" color={theme.accent} style={styles.loader} />}

          {error && <Text style={styles.error}>{error}</Text>}

          {recipe && (
            <>
              <Text style={styles.sectionLabel}>Ingredientes</Text>
              <View style={styles.ingredientBlock}>
                {recipe.ingredients.map((item, i) => (
                  <View key={`${item.name}-${i}`} style={styles.ingredientRow}>
                    <Text style={styles.ingredientName}>{item.name}</Text>
                    <View style={styles.leader} />
                    <Text style={styles.ingredientQty}>{item.qty}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.sectionLabel}>Preparación</Text>
              {recipe.steps.map((step, i) => (
                <View key={`step-${i}`} style={styles.stepRow}>
                  <Text style={styles.stepNumber}>{i + 1}</Text>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    sheet: {
      flex: 1,
      // La receta va sobre `surface`, no sobre `bg`: se lee como una ficha aparte.
      backgroundColor: theme.surface,
      paddingTop: 56,
      paddingBottom: 26,
    },
    header: {
      paddingHorizontal: 26,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 14,
    },
    headerText: {
      flexShrink: 1,
    },
    eyebrow: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: theme.accent,
      marginBottom: 10,
    },
    title: {
      fontFamily: fonts.displaySemi,
      fontSize: 30,
      lineHeight: 32,
      color: theme.ink,
      letterSpacing: -0.45,
    },
    closeBtn: {
      width: 36,
      height: 36,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radii.chip,
    },
    metaStrip: {
      marginHorizontal: 26,
      marginVertical: 20,
      flexDirection: 'row',
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.line26,
    },
    metaCell: {
      flex: 1,
      paddingVertical: 12,
    },
    metaCellPadded: {
      paddingLeft: 16,
    },
    metaDivider: {
      width: 1,
      backgroundColor: theme.line26,
    },
    metaLabel: {
      fontFamily: fonts.body,
      fontSize: 12.5,
      color: theme.inkSoft,
      marginBottom: 4,
    },
    // Los datos duros (porciones, tiempo) van en sans, no en serif.
    metaValue: {
      fontFamily: fonts.bodyMedium,
      fontSize: 17,
      color: theme.ink,
    },
    body: {
      paddingHorizontal: 26,
      paddingBottom: 20,
    },
    loader: {
      marginTop: 40,
    },
    sectionLabel: {
      fontFamily: fonts.bodySemi,
      fontSize: 15,
      letterSpacing: -0.15,
      color: theme.ink,
      marginBottom: 8,
    },
    ingredientBlock: {
      marginBottom: 20,
    },
    ingredientRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 8,
      paddingVertical: 7,
      borderBottomWidth: 1,
      borderBottomColor: theme.line14,
    },
    ingredientName: {
      fontFamily: fonts.body,
      fontSize: 14.5,
      color: theme.ink,
      flexShrink: 1,
    },
    leader: {
      flex: 1,
      borderBottomWidth: 1,
      borderStyle: 'dotted',
      borderBottomColor: theme.mut40,
    },
    ingredientQty: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13.5,
      color: theme.inkSoft,
    },
    stepRow: {
      flexDirection: 'row',
      gap: 14,
      paddingBottom: 14,
    },
    stepNumber: {
      fontFamily: fonts.bodySemi,
      fontSize: 20,
      lineHeight: 24,
      color: theme.accent,
      minWidth: 22,
    },
    stepText: {
      fontFamily: fonts.body,
      fontSize: 14.5,
      lineHeight: 23,
      color: theme.ink,
      flexShrink: 1,
    },
    error: {
      fontFamily: fonts.body,
      fontSize: 13,
      lineHeight: 19,
      color: theme.accent,
      marginTop: 16,
    },
  });
}
