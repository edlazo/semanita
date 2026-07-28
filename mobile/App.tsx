import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { Picker } from '@react-native-picker/picker';
import { supabase } from './lib/supabase';
import AuthScreen from './components/AuthScreen';
import { PrimaryButton, SecondaryButton } from './components/Buttons';
import Checkbox from './components/Checkbox';
import RecipeModal, { Recipe } from './components/RecipeModal';
import { radii, Theme, useAppTheme } from './theme';
import { captureError, clearUser, identifyUser, initTelemetry, track } from './lib/telemetry';

initTelemetry();

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

function storageKeyFor(userId: string) {
  return `comida:currentWeek:${userId}`;
}

/** El backend rechaza cualquier llamada sin un token de sesión válido. */
async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const RESTRICTION_OPTIONS = [
  'Ninguna',
  'Vegetariano',
  'Vegano',
  'Sin gluten',
  'Sin lactosa',
  'Otros',
] as const;

type PickedImage = {
  uri: string;
  fileName: string;
  mimeType: string;
  webFile?: File;
};

type Meal = {
  name: string;
  description: string;
  ingredientsUsed: string[];
  ingredientsToBuy: string[];
};

type ShoppingCategory = {
  category: string;
  items: string[];
};

type PersistedState = {
  ingredients: string[] | null;
  menu: Meal[] | null;
  selectedMeals: number[];
  shoppingList: ShoppingCategory[] | null;
  checkedItems: string[];
  restrictionOption: string;
  customRestriction: string;
};

export default function App() {
  const { theme, mode, toggleMode } = useAppTheme();
  const styles = getStyles(theme);

  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        identifyUser(newSession.user.id, newSession.user.email ?? undefined);
      } else {
        clearUser();
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const [image, setImage] = useState<PickedImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [ingredients, setIngredients] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newIngredient, setNewIngredient] = useState('');
  const [menu, setMenu] = useState<Meal[] | null>(null);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [selectedMeals, setSelectedMeals] = useState<Set<number>>(new Set());
  const [shoppingList, setShoppingList] = useState<ShoppingCategory[] | null>(null);
  const [shoppingLoading, setShoppingLoading] = useState(false);
  const [shoppingError, setShoppingError] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [restrictionOption, setRestrictionOption] = useState<string>('Ninguna');
  const [customRestriction, setCustomRestriction] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [recipeMeal, setRecipeMeal] = useState<Meal | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipeError, setRecipeError] = useState<string | null>(null);

  const effectiveRestrictions =
    restrictionOption === 'Ninguna'
      ? ''
      : restrictionOption === 'Otros'
        ? customRestriction.trim()
        : restrictionOption;

  const storageKey = session ? storageKeyFor(session.user.id) : null;

  useEffect(() => {
    if (!storageKey) {
      setHydrated(false);
      return;
    }
    setHydrated(false);
    AsyncStorage.getItem(storageKey)
      .then((raw) => {
        if (raw) {
          const saved: PersistedState = JSON.parse(raw);
          setIngredients(saved.ingredients);
          setMenu(saved.menu);
          setSelectedMeals(new Set(saved.selectedMeals));
          setShoppingList(saved.shoppingList);
          setCheckedItems(new Set(saved.checkedItems));
          setRestrictionOption(saved.restrictionOption ?? 'Ninguna');
          setCustomRestriction(saved.customRestriction ?? '');
        } else {
          // No saved data for this account — clear out whatever a previous
          // logged-in user on this device may have left in memory.
          setImage(null);
          setIngredients(null);
          setMenu(null);
          setSelectedMeals(new Set());
          setShoppingList(null);
          setCheckedItems(new Set());
          setRestrictionOption('Ninguna');
          setCustomRestriction('');
        }
      })
      .finally(() => setHydrated(true));
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated || !storageKey) return;
    const toSave: PersistedState = {
      ingredients,
      menu,
      selectedMeals: [...selectedMeals],
      shoppingList,
      checkedItems: [...checkedItems],
      restrictionOption,
      customRestriction,
    };
    AsyncStorage.setItem(storageKey, JSON.stringify(toSave));
  }, [hydrated, storageKey, ingredients, menu, selectedMeals, shoppingList, checkedItems, restrictionOption, customRestriction]);

  function startNewWeek() {
    setImage(null);
    setError(null);
    setIngredients(null);
    setMenu(null);
    setMenuError(null);
    setSelectedMeals(new Set());
    setShoppingList(null);
    setShoppingError(null);
    setCheckedItems(new Set());
    setRestrictionOption('Ninguna');
    setCustomRestriction('');
    if (storageKey) AsyncStorage.removeItem(storageKey);
  }

  function toggleMealSelected(index: number) {
    setSelectedMeals((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  async function generateShoppingList() {
    if (!menu) return;
    const chosenMeals = menu.filter((_, i) => selectedMeals.has(i));
    const items = [...new Set(chosenMeals.flatMap((m) => m.ingredientsToBuy))];
    if (items.length === 0) return;

    setShoppingLoading(true);
    setShoppingError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-shopping-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ items }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Error desconocido');
      }
      setShoppingList(data.categories);
      setCheckedItems(new Set());
      track('lista_compras_generada', {
        categorias: data.categories.length,
        items: items.length,
        comidas_elegidas: chosenMeals.length,
      });
    } catch (err) {
      captureError(err, { paso: 'generate-shopping-list' });
      setShoppingError(err instanceof Error ? err.message : 'No se pudo generar la lista de compras.');
    } finally {
      setShoppingLoading(false);
    }
  }

  function toggleChecked(key: string) {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  async function generateMenu() {
    if (!ingredients || ingredients.length === 0) return;
    setMenuLoading(true);
    setMenuError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ ingredients, restrictions: effectiveRestrictions || undefined }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Error desconocido');
      }
      const newMenu = data.menu as Meal[];
      setMenu(newMenu);
      setSelectedMeals(new Set(newMenu.map((_, i) => i)));
      track('menu_generado', {
        comidas: newMenu.length,
        ingredientes: ingredients.length,
        con_restricciones: effectiveRestrictions.length > 0,
      });
    } catch (err) {
      captureError(err, { paso: 'generate-menu' });
      setMenuError(err instanceof Error ? err.message : 'No se pudo generar el menú.');
    } finally {
      setMenuLoading(false);
    }
  }

  async function regenerateMeal(index: number) {
    if (!ingredients || !menu) return;
    setRegeneratingIndex(index);
    setMenuError(null);
    try {
      const avoidNames = menu.map((m) => m.name);
      const response = await fetch(`${API_BASE_URL}/api/generate-menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({
          ingredients,
          count: 1,
          avoidNames,
          restrictions: effectiveRestrictions || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Error desconocido');
      }
      const [newMeal] = data.menu as Meal[];
      setMenu((prev) => prev?.map((m, i) => (i === index ? newMeal : m)) ?? prev);
      track('comida_regenerada');
    } catch (err) {
      captureError(err, { paso: 'regenerate-meal' });
      setMenuError(err instanceof Error ? err.message : 'No se pudo regenerar la comida.');
    } finally {
      setRegeneratingIndex(null);
    }
  }

  async function openRecipe(meal: Meal) {
    setRecipeMeal(meal);
    setRecipe(null);
    setRecipeError(null);
    setRecipeLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({
          mealName: meal.name,
          description: meal.description,
          restrictions: effectiveRestrictions || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Error desconocido');
      }
      setRecipe(data.recipe);
      track('receta_vista', { pasos: data.recipe.steps.length });
    } catch (err) {
      captureError(err, { paso: 'generate-recipe' });
      setRecipeError(err instanceof Error ? err.message : 'No se pudo generar la receta.');
    } finally {
      setRecipeLoading(false);
    }
  }

  function closeRecipe() {
    setRecipeMeal(null);
    setRecipe(null);
    setRecipeError(null);
  }

  function removeIngredient(index: number) {
    setIngredients((prev) => prev?.filter((_, i) => i !== index) ?? prev);
  }

  function addIngredient() {
    const trimmed = newIngredient.trim();
    if (!trimmed) return;
    setIngredients((prev) => [...(prev ?? []), trimmed]);
    setNewIngredient('');
  }

  function startTextEntry() {
    setImage(null);
    setError(null);
    setIngredients([]);
    setMenu(null);
    setShoppingList(null);
  }

  function toPickedImage(asset: ImagePicker.ImagePickerAsset): PickedImage {
    return {
      uri: asset.uri,
      fileName: asset.fileName ?? 'photo.jpg',
      mimeType: asset.mimeType ?? 'image/jpeg',
      webFile: asset.file,
    };
  }

  async function handlePicked(result: ImagePicker.ImagePickerResult) {
    if (result.canceled || result.assets.length === 0) return;
    const picked = toPickedImage(result.assets[0]);
    setImage(picked);
    setIngredients(null);
    setError(null);
    setMenu(null);
    setShoppingList(null);
    setSelectedMeals(new Set());
    setCheckedItems(new Set());
    await detectIngredients(picked);
  }

  async function pickFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tus fotos para continuar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    await handlePicked(result);
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a la cámara para continuar.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    await handlePicked(result);
  }

  async function detectIngredients(picked: PickedImage) {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      if (Platform.OS === 'web' && picked.webFile) {
        formData.append('photo', picked.webFile, picked.fileName);
      } else {
        formData.append(
          'photo',
          {
            uri: picked.uri,
            name: picked.fileName,
            type: picked.mimeType,
          } as unknown as Blob
        );
      }

      const response = await fetch(`${API_BASE_URL}/api/detect-ingredients`, {
        method: 'POST',
        body: formData,
        headers: await authHeaders(),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Error desconocido');
      }
      setIngredients(data.ingredients);
      track('ingredientes_detectados', { cantidad: data.ingredients.length });
    } catch (err) {
      captureError(err, { paso: 'detect-ingredients' });
      setError(err instanceof Error ? err.message : 'No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={styles.container}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />

      <View style={styles.topRow}>
        <SecondaryButton title="Cerrar sesión" onPress={() => supabase.auth.signOut()} theme={theme} />
        {ingredients && (
          <SecondaryButton title="Semana nueva" onPress={startNewWeek} theme={theme} />
        )}
        <SecondaryButton
          title={mode === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          onPress={toggleMode}
          theme={theme}
        />
      </View>

      <Text style={styles.title}>¿Qué hay en tu heladera?</Text>
      <View style={styles.rule} />

      <View style={styles.buttonRow}>
        <SecondaryButton title="Sacar foto" onPress={takePhoto} theme={theme} />
        <SecondaryButton title="Elegir de galería" onPress={pickFromLibrary} theme={theme} />
      </View>
      <SecondaryButton title="Escribir lista a mano" onPress={startTextEntry} theme={theme} />

      {image && <Image source={{ uri: image.uri }} style={styles.preview} />}

      {loading && <ActivityIndicator size="large" color={theme.accent} style={styles.spacing} />}

      {error && <Text style={styles.error}>{error}</Text>}

      {ingredients && (
        <View style={styles.spacing}>
          <Text style={styles.fieldLabel}>Ingredientes</Text>
          {ingredients.length === 0 ? (
            <Text style={styles.bodyText}>
              {image ? 'No se detectó ningún ingrediente.' : 'Agregá los ingredientes que tengas.'}
            </Text>
          ) : (
            <View style={styles.chipsWrap}>
              {ingredients.map((item, i) => (
                <View key={`${item}-${i}`} style={styles.chip}>
                  <Text style={styles.chipText}>{item}</Text>
                  <Pressable onPress={() => removeIngredient(i)} hitSlop={8}>
                    <Text style={styles.removeText}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          <View style={styles.addRow}>
            <TextInput
              style={styles.input}
              placeholder="Ej: crema de maní"
              placeholderTextColor={theme.inkSoft}
              value={newIngredient}
              onChangeText={setNewIngredient}
              onSubmitEditing={addIngredient}
            />
            <SecondaryButton title="Agregar" onPress={addIngredient} theme={theme} />
          </View>

          <View style={styles.spacing}>
            <Text style={styles.fieldLabel}>Restricciones (opcional)</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={restrictionOption}
                onValueChange={setRestrictionOption}
                dropdownIconColor={theme.ink}
                style={{ color: theme.ink }}
              >
                {RESTRICTION_OPTIONS.map((option) => (
                  <Picker.Item key={option} label={option} value={option} />
                ))}
              </Picker>
            </View>
            {restrictionOption === 'Otros' && (
              <TextInput
                style={[styles.input, styles.spacing]}
                placeholder="Ej: sin frutos secos"
                placeholderTextColor={theme.inkSoft}
                value={customRestriction}
                onChangeText={setCustomRestriction}
              />
            )}
          </View>

          <View style={styles.spacing}>
            <PrimaryButton
              title="Generar menú semanal"
              onPress={generateMenu}
              disabled={menuLoading}
              theme={theme}
            />
          </View>
        </View>
      )}

      {menuLoading && <ActivityIndicator size="large" color={theme.accent} style={styles.spacing} />}

      {menuError && <Text style={styles.error}>{menuError}</Text>}

      {menu && (
        <View style={styles.spacing}>
          <Text style={styles.fieldLabel}>Menú de la semana</Text>
          {menu.map((meal, i) => {
            const selected = selectedMeals.has(i);
            return (
              <View key={`${meal.name}-${i}`} style={styles.mealCard}>
                <View style={styles.mealTop}>
                  <Checkbox checked={selected} onPress={() => toggleMealSelected(i)} theme={theme} />
                  <Text style={selected ? styles.mealName : styles.mealNameUnselected}>
                    {meal.name}
                  </Text>
                </View>
                <Text style={styles.mealDesc}>{meal.description}</Text>
                {meal.ingredientsToBuy.length > 0 && (
                  <Text style={styles.mealBuy}>
                    Comprar: {meal.ingredientsToBuy.join(', ')}
                  </Text>
                )}
                <View style={styles.mealActions}>
                  <SecondaryButton
                    title={regeneratingIndex === i ? 'Regenerando...' : 'Regenerar'}
                    onPress={() => regenerateMeal(i)}
                    disabled={regeneratingIndex !== null}
                    theme={theme}
                  />
                  <SecondaryButton
                    title="Ver receta"
                    onPress={() => openRecipe(meal)}
                    theme={theme}
                  />
                </View>
              </View>
            );
          })}

          <PrimaryButton
            title="Ver lista de compras"
            onPress={generateShoppingList}
            disabled={shoppingLoading || selectedMeals.size === 0}
            theme={theme}
          />
        </View>
      )}

      {shoppingLoading && <ActivityIndicator size="large" color={theme.accent} style={styles.spacing} />}

      {shoppingError && <Text style={styles.error}>{shoppingError}</Text>}

      {shoppingList && (
        <View style={styles.spacing}>
          <Text style={styles.fieldLabel}>Lista de compras</Text>
          {shoppingList.map((cat) => (
            <View key={cat.category} style={styles.spacing}>
              <Text style={styles.categoryTitle}>{cat.category}</Text>
              {cat.items.map((item) => {
                const key = `${cat.category}::${item}`;
                const checked = checkedItems.has(key);
                return (
                  <Pressable
                    key={key}
                    style={styles.itemRow}
                    onPress={() => toggleChecked(key)}
                  >
                    <Checkbox checked={checked} theme={theme} />
                    <Text style={checked ? styles.itemChecked : styles.bodyText}>{item}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      )}

      <RecipeModal
        visible={recipeMeal !== null}
        onClose={closeRecipe}
        mealName={recipeMeal?.name ?? ''}
        recipe={recipe}
        loading={recipeLoading}
        error={recipeError}
        theme={theme}
      />
    </ScrollView>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      flexGrow: 1,
      alignItems: 'stretch',
      paddingTop: 56,
      paddingHorizontal: 26,
      paddingBottom: 48,
      gap: 4,
    },
    topRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 20,
    },
    title: {
      fontFamily: theme.fontDisplay,
      fontWeight: '400',
      fontSize: 26,
      color: theme.ink,
      letterSpacing: -0.3,
    },
    rule: {
      width: 44,
      height: 1,
      backgroundColor: theme.accent,
      marginTop: 10,
      marginBottom: 18,
    },
    fieldLabel: {
      fontFamily: theme.fontDisplay,
      fontStyle: 'italic',
      fontSize: 14,
      color: theme.accentText,
      marginBottom: 8,
    },
    bodyText: {
      fontFamily: theme.fontBody,
      fontSize: 14,
      color: theme.ink,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 8,
    },
    preview: {
      width: '100%',
      height: 220,
      borderRadius: radii.card,
      marginTop: 16,
    },
    spacing: {
      marginTop: 20,
      alignSelf: 'stretch',
    },
    error: {
      color: theme.accent2,
      fontFamily: theme.fontBody,
      marginTop: 8,
    },
    chipsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 14,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.chipBg,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radii.chip,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    chipText: {
      fontFamily: theme.fontBody,
      fontSize: 13.5,
      color: theme.ink,
    },
    removeText: {
      color: theme.inkSoft,
      fontSize: 14,
    },
    addRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    input: {
      flex: 1,
      fontFamily: theme.fontBody,
      color: theme.ink,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radii.btn,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    pickerWrapper: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radii.btn,
      backgroundColor: theme.surface,
      overflow: 'hidden',
    },
    mealCard: {
      backgroundColor: theme.surface,
      borderTopWidth: 2,
      borderTopColor: theme.accent,
      borderRadius: radii.card,
      padding: 16,
      marginBottom: 14,
      gap: 6,
      shadowColor: '#000',
      shadowOpacity: 0.18,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },
    mealTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    mealActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginLeft: 30,
      marginTop: 2,
    },
    mealName: {
      fontFamily: theme.fontDisplay,
      fontSize: 15.5,
      fontWeight: '500',
      color: theme.ink,
      flexShrink: 1,
    },
    mealNameUnselected: {
      fontFamily: theme.fontDisplay,
      fontSize: 15.5,
      fontWeight: '500',
      color: theme.inkSoft,
      textDecorationLine: 'line-through',
      flexShrink: 1,
    },
    mealDesc: {
      fontFamily: theme.fontBody,
      fontSize: 13,
      color: theme.inkSoft,
      marginLeft: 30,
    },
    mealBuy: {
      fontFamily: theme.fontBody,
      color: theme.inkSoft,
      fontSize: 12,
      marginLeft: 30,
      marginBottom: 4,
    },
    categoryTitle: {
      fontFamily: theme.fontDisplay,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      fontSize: 13,
      fontWeight: '500',
      color: theme.accentText,
      borderBottomWidth: 1,
      borderBottomColor: theme.accent,
      paddingBottom: 6,
      marginBottom: 8,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 8,
    },
    itemChecked: {
      fontFamily: theme.fontBody,
      fontSize: 14,
      color: theme.inkSoft,
      textDecorationLine: 'line-through',
    },
  });
}
