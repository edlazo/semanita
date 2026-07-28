import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
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

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

function storageKeyFor(userId: string) {
  return `comida:currentWeek:${userId}`;
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
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Error desconocido');
      }
      setShoppingList(data.categories);
      setCheckedItems(new Set());
    } catch (err) {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients, restrictions: effectiveRestrictions || undefined }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Error desconocido');
      }
      const newMenu = data.menu as Meal[];
      setMenu(newMenu);
      setSelectedMeals(new Set(newMenu.map((_, i) => i)));
    } catch (err) {
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
        headers: { 'Content-Type': 'application/json' },
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
    } catch (err) {
      setMenuError(err instanceof Error ? err.message : 'No se pudo regenerar la comida.');
    } finally {
      setRegeneratingIndex(null);
    }
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
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Error desconocido');
      }
      setIngredients(data.ingredients);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>¿Qué hay en tu heladera?</Text>
      <Button
        title="Cerrar sesión"
        onPress={() => supabase.auth.signOut()}
        color="#999"
      />

      {ingredients && (
        <Button title="Empezar semana nueva" onPress={startNewWeek} color="#999" />
      )}

      <View style={styles.buttonRow}>
        <Button title="Sacar foto" onPress={takePhoto} />
        <Button title="Elegir de galería" onPress={pickFromLibrary} />
      </View>
      <Button title="Escribir lista a mano" onPress={startTextEntry} />

      {image && <Image source={{ uri: image.uri }} style={styles.preview} />}

      {loading && <ActivityIndicator size="large" style={styles.spacing} />}

      {error && <Text style={styles.error}>{error}</Text>}

      {ingredients && (
        <View style={styles.spacing}>
          <Text style={styles.subtitle}>Ingredientes:</Text>
          {ingredients.length === 0 ? (
            <Text>
              {image ? 'No se detectó ningún ingrediente.' : 'Agregá los ingredientes que tengas.'}
            </Text>
          ) : (
            ingredients.map((item, i) => (
              <View key={`${item}-${i}`} style={styles.ingredientRow}>
                <Text style={styles.ingredientText}>• {item}</Text>
                <Pressable onPress={() => removeIngredient(i)} hitSlop={8}>
                  <Text style={styles.removeText}>✕</Text>
                </Pressable>
              </View>
            ))
          )}

          <View style={styles.addRow}>
            <TextInput
              style={styles.input}
              placeholder="Ej: crema de maní"
              value={newIngredient}
              onChangeText={setNewIngredient}
              onSubmitEditing={addIngredient}
            />
            <Button title="Agregar" onPress={addIngredient} />
          </View>

          <View style={styles.spacing}>
            <Text style={styles.subtitle}>Restricciones (opcional):</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={restrictionOption} onValueChange={setRestrictionOption}>
                {RESTRICTION_OPTIONS.map((option) => (
                  <Picker.Item key={option} label={option} value={option} />
                ))}
              </Picker>
            </View>
            {restrictionOption === 'Otros' && (
              <TextInput
                style={[styles.input, styles.spacing]}
                placeholder="Ej: sin frutos secos"
                value={customRestriction}
                onChangeText={setCustomRestriction}
              />
            )}
          </View>

          <View style={styles.spacing}>
            <Button title="Generar menú semanal" onPress={generateMenu} disabled={menuLoading} />
          </View>
        </View>
      )}

      {menuLoading && <ActivityIndicator size="large" style={styles.spacing} />}

      {menuError && <Text style={styles.error}>{menuError}</Text>}

      {menu && (
        <View style={styles.spacing}>
          <Text style={styles.subtitle}>Menú de la semana:</Text>
          {menu.map((meal, i) => {
            const selected = selectedMeals.has(i);
            return (
              <View key={`${meal.name}-${i}`} style={styles.mealCard}>
                <Pressable
                  style={styles.ingredientRow}
                  onPress={() => toggleMealSelected(i)}
                >
                  <Text style={selected ? styles.mealName : styles.mealNameUnselected}>
                    {selected ? '☑' : '☐'} {meal.name}
                  </Text>
                </Pressable>
                <Text>{meal.description}</Text>
                {meal.ingredientsToBuy.length > 0 && (
                  <Text style={styles.mealBuy}>
                    Comprar: {meal.ingredientsToBuy.join(', ')}
                  </Text>
                )}
                <Button
                  title={regeneratingIndex === i ? 'Regenerando...' : 'Regenerar'}
                  onPress={() => regenerateMeal(i)}
                  disabled={regeneratingIndex !== null}
                />
              </View>
            );
          })}

          <Button
            title="Ver lista de compras"
            onPress={generateShoppingList}
            disabled={shoppingLoading || selectedMeals.size === 0}
          />
        </View>
      )}

      {shoppingLoading && <ActivityIndicator size="large" style={styles.spacing} />}

      {shoppingError && <Text style={styles.error}>{shoppingError}</Text>}

      {shoppingList && (
        <View style={styles.spacing}>
          <Text style={styles.subtitle}>Lista de compras:</Text>
          {shoppingList.map((cat) => (
            <View key={cat.category} style={styles.spacing}>
              <Text style={styles.categoryTitle}>{cat.category}</Text>
              {cat.items.map((item) => {
                const key = `${cat.category}::${item}`;
                const checked = checkedItems.has(key);
                return (
                  <Pressable
                    key={key}
                    style={styles.ingredientRow}
                    onPress={() => toggleChecked(key)}
                  >
                    <Text style={checked ? styles.itemChecked : styles.ingredientText}>
                      {checked ? '☑' : '☐'} {item}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 20,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  preview: {
    width: 250,
    height: 250,
    borderRadius: 8,
  },
  spacing: {
    marginTop: 16,
    alignSelf: 'stretch',
  },
  error: {
    color: 'red',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  ingredientText: {
    fontSize: 15,
  },
  removeText: {
    color: '#999',
    fontSize: 16,
    paddingHorizontal: 8,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    overflow: 'hidden',
  },
  mealCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 6,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
  },
  mealNameUnselected: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    textDecorationLine: 'line-through',
  },
  mealBuy: {
    color: '#666',
    fontSize: 13,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemChecked: {
    fontSize: 15,
    color: '#999',
    textDecorationLine: 'line-through',
  },
});
