import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { radii, Theme } from '../theme';

export type Recipe = {
  servings: string;
  time: string;
  ingredients: string[];
  steps: string[];
};

type Props = {
  visible: boolean;
  onClose: () => void;
  mealName: string;
  recipe: Recipe | null;
  loading: boolean;
  error: string | null;
  theme: Theme;
};

export default function RecipeModal({
  visible,
  onClose,
  mealName,
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
            <Text style={styles.title}>{mealName}</Text>
            <View style={styles.rule} />
          </View>
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn} accessibilityLabel="Cerrar receta">
            <Text style={styles.closeIcon}>✕</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          {loading && <ActivityIndicator size="large" color={theme.accent} style={styles.spacing} />}

          {error && <Text style={styles.error}>{error}</Text>}

          {recipe && (
            <>
              <View style={styles.metaRow}>
                <Text style={styles.meta}>{recipe.servings}</Text>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.meta}>{recipe.time}</Text>
              </View>

              <Text style={styles.sectionLabel}>Ingredientes</Text>
              {recipe.ingredients.map((item, i) => (
                <View key={`${item}-${i}`} style={styles.ingredientRow}>
                  <Text style={styles.bullet}>—</Text>
                  <Text style={styles.bodyText}>{item}</Text>
                </View>
              ))}

              <Text style={[styles.sectionLabel, styles.spacing]}>Preparación</Text>
              {recipe.steps.map((step, i) => (
                <View key={`step-${i}`} style={styles.stepRow}>
                  <Text style={styles.stepNumber}>{i + 1}</Text>
                  <Text style={styles.bodyText}>{step}</Text>
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
      backgroundColor: theme.bg,
      paddingTop: 56,
      paddingHorizontal: 26,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
    },
    headerText: {
      flexShrink: 1,
    },
    title: {
      fontFamily: theme.fontDisplay,
      fontWeight: '400',
      fontSize: 24,
      color: theme.ink,
      letterSpacing: -0.3,
    },
    rule: {
      width: 44,
      height: 1,
      backgroundColor: theme.accent,
      marginTop: 10,
    },
    closeBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radii.btn,
      backgroundColor: theme.surface,
    },
    closeIcon: {
      color: theme.ink,
      fontSize: 15,
      lineHeight: 18,
    },
    body: {
      paddingTop: 24,
      paddingBottom: 48,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 24,
    },
    meta: {
      fontFamily: theme.fontDisplay,
      fontStyle: 'italic',
      fontSize: 14,
      color: theme.accentText,
    },
    metaDot: {
      color: theme.inkSoft,
      fontSize: 14,
    },
    sectionLabel: {
      fontFamily: theme.fontDisplay,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      fontSize: 13,
      fontWeight: '500',
      color: theme.accentText,
      borderBottomWidth: 1,
      borderBottomColor: theme.accent,
      paddingBottom: 6,
      marginBottom: 12,
    },
    ingredientRow: {
      flexDirection: 'row',
      gap: 10,
      paddingVertical: 5,
    },
    bullet: {
      color: theme.accent,
      fontSize: 14,
    },
    stepRow: {
      flexDirection: 'row',
      gap: 12,
      paddingVertical: 8,
    },
    stepNumber: {
      fontFamily: theme.fontDisplay,
      fontSize: 15,
      color: theme.accentText,
      minWidth: 18,
    },
    bodyText: {
      fontFamily: theme.fontBody,
      fontSize: 14,
      lineHeight: 21,
      color: theme.ink,
      flexShrink: 1,
    },
    spacing: {
      marginTop: 24,
    },
    error: {
      color: theme.accent2,
      fontFamily: theme.fontBody,
      marginTop: 16,
    },
  });
}
