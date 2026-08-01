import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  BodoniModa_400Regular,
  BodoniModa_400Regular_Italic,
  BodoniModa_500Medium,
} from '@expo-google-fonts/bodoni-moda';
import {
  Karla_400Regular,
  Karla_500Medium,
  Karla_600SemiBold,
  Karla_700Bold,
} from '@expo-google-fonts/karla';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import AuthScreen from './components/AuthScreen';
import RecipeModal, { Recipe } from './components/RecipeModal';
import { Step } from './components/Chrome';
import IngredientsScreen, { PhotoState, Source } from './screens/IngredientsScreen';
import MenuScreen, { Meal } from './screens/MenuScreen';
import ShoppingScreen, { ShoppingCategory } from './screens/ShoppingScreen';
import { useAppTheme } from './theme';
import { captureError, clearUser, identifyUser, initTelemetry, track } from './lib/telemetry';

initTelemetry();

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

const DAYS = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO'];

function storageKeyFor(userId: string) {
  return `semanita:currentWeek:${userId}`;
}

/** El backend rechaza cualquier llamada sin un token de sesión válido. */
async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type PickedImage = {
  uri: string;
  fileName: string;
  mimeType: string;
  webFile?: File;
};

type PersistedState = {
  step: Step;
  ingredients: string[];
  meals: Meal[] | null;
  selectedMeals: number[];
  regenCounts: Record<number, number>;
  shoppingList: ShoppingCategory[] | null;
  checkedItems: string[];
  restriction: string;
  otherText: string;
};

export default function App() {
  const { theme, mode, toggleMode } = useAppTheme();

  const [fontsLoaded] = useFonts({
    BodoniModa_400Regular,
    BodoniModa_400Regular_Italic,
    BodoniModa_500Medium,
    Karla_400Regular,
    Karla_500Medium,
    Karla_600SemiBold,
    Karla_700Bold,
  });

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

  const [step, setStep] = useState<Step>(1);

  const [source, setSource] = useState<Source>(null);
  const [photoState, setPhotoState] = useState<PhotoState>('none');
  const [image, setImage] = useState<PickedImage | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [detectedCount, setDetectedCount] = useState(0);
  const [draft, setDraft] = useState('');
  const [manualOpen, setManualOpen] = useState(false);
  const [manualText, setManualText] = useState('');
  const [restriction, setRestriction] = useState('Ninguna');
  const [otherText, setOtherText] = useState('');

  const [meals, setMeals] = useState<Meal[] | null>(null);
  const [selectedMeals, setSelectedMeals] = useState<Set<number>>(new Set());
  const [regenCounts, setRegenCounts] = useState<Record<number, number>>({});
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);

  const [shoppingList, setShoppingList] = useState<ShoppingCategory[] | null>(null);
  const [shoppingLoading, setShoppingLoading] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const [recipeIndex, setRecipeIndex] = useState<number | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipeError, setRecipeError] = useState<string | null>(null);

  const [hydrated, setHydrated] = useState(false);

  const effectiveRestrictions =
    restriction === 'Ninguna' ? '' : restriction === 'Otros' ? otherText.trim() : restriction;

  const chosenMeals = (meals ?? []).filter((_, i) => selectedMeals.has(i));
  const pendingItems = [...new Set(chosenMeals.flatMap((m) => m.ingredientsToBuy))];

  const storageKey = session ? storageKeyFor(session.user.id) : null;

  function resetWeek() {
    setStep(1);
    setSource(null);
    setPhotoState('none');
    setImage(null);
    setIngredients([]);
    setDetectedCount(0);
    setDraft('');
    setManualOpen(false);
    setManualText('');
    setRestriction('Ninguna');
    setOtherText('');
    setMeals(null);
    setSelectedMeals(new Set());
    setRegenCounts({});
    setGenError(null);
    setMenuError(null);
    setShoppingList(null);
    setCheckedItems(new Set());
  }

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
          setStep(saved.step ?? 1);
          setIngredients(saved.ingredients ?? []);
          setMeals(saved.meals);
          setSelectedMeals(new Set(saved.selectedMeals ?? []));
          setRegenCounts(saved.regenCounts ?? {});
          setShoppingList(saved.shoppingList);
          setCheckedItems(new Set(saved.checkedItems ?? []));
          setRestriction(saved.restriction ?? 'Ninguna');
          setOtherText(saved.otherText ?? '');
        } else {
          // Sin datos guardados para esta cuenta: limpiar lo que haya dejado otra
          // sesión en memoria en este mismo dispositivo.
          resetWeek();
        }
      })
      .finally(() => setHydrated(true));
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated || !storageKey) return;
    const toSave: PersistedState = {
      step,
      ingredients,
      meals,
      selectedMeals: [...selectedMeals],
      regenCounts,
      shoppingList,
      checkedItems: [...checkedItems],
      restriction,
      otherText,
    };
    AsyncStorage.setItem(storageKey, JSON.stringify(toSave));
  }, [
    hydrated,
    storageKey,
    step,
    ingredients,
    meals,
    selectedMeals,
    regenCounts,
    shoppingList,
    checkedItems,
    restriction,
    otherText,
  ]);

  function addIngredients(values: string[]) {
    const cleaned = values
      .flatMap((v) => v.split(/[,\n]/))
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);
    if (cleaned.length === 0) return;
    setIngredients((prev) => [...new Set([...prev, ...cleaned])]);
  }

  function handleAddDraft() {
    addIngredients([draft]);
    setDraft('');
  }

  function handleManualAdd() {
    addIngredients([manualText]);
    setManualText('');
    setManualOpen(false);
  }

  function openManual() {
    setSource('manual');
    setManualOpen(true);
    setPhotoState('none');
  }

  function toPickedImage(asset: ImagePicker.ImagePickerAsset): PickedImage {
    return {
      uri: asset.uri,
      fileName: asset.fileName ?? 'photo.jpg',
      mimeType: asset.mimeType ?? 'image/jpeg',
      webFile: asset.file,
    };
  }

  async function handlePicked(result: ImagePicker.ImagePickerResult, from: Source) {
    if (result.canceled || result.assets.length === 0) return;
    const picked = toPickedImage(result.assets[0]);
    setSource(from);
    setImage(picked);
    setManualOpen(false);
    setGenError(null);
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
    await handlePicked(result, 'gallery');
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a la cámara para continuar.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    await handlePicked(result, 'camera');
  }

  async function detectIngredients(picked: PickedImage) {
    setPhotoState('loading');
    setGenError(null);
    try {
      const formData = new FormData();
      if (Platform.OS === 'web' && picked.webFile) {
        formData.append('photo', picked.webFile, picked.fileName);
      } else {
        formData.append('photo', {
          uri: picked.uri,
          name: picked.fileName,
          type: picked.mimeType,
        } as unknown as Blob);
      }

      const response = await fetch(`${API_BASE_URL}/api/detect-ingredients`, {
        method: 'POST',
        body: formData,
        headers: await authHeaders(),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Error desconocido');

      const found: string[] = data.ingredients ?? [];
      setDetectedCount(found.length);
      if (found.length === 0) {
        setPhotoState('empty');
      } else {
        setPhotoState('ok');
        addIngredients(found);
      }
      track('ingredientes_detectados', { cantidad: found.length, origen: source ?? 'foto' });
    } catch (err) {
      captureError(err, { paso: 'detect-ingredients' });
      setPhotoState('empty');
      setGenError(err instanceof Error ? err.message : 'No se pudo conectar con el servidor.');
    }
  }

  async function generateMenu() {
    if (ingredients.length === 0) {
      setGenError('Necesitamos al menos un ingrediente para armarte la semana.');
      return;
    }
    setGenerating(true);
    setGenError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ ingredients, restrictions: effectiveRestrictions || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Error desconocido');

      const newMenu = data.menu as Meal[];
      setMeals(newMenu);
      setSelectedMeals(new Set(newMenu.map((_, i) => i)));
      setRegenCounts({});
      setShoppingList(null);
      setCheckedItems(new Set());
      setStep(2);
      track('menu_generado', {
        comidas: newMenu.length,
        ingredientes: ingredients.length,
        con_restricciones: effectiveRestrictions.length > 0,
      });
    } catch (err) {
      captureError(err, { paso: 'generate-menu' });
      setGenError(err instanceof Error ? err.message : 'No se pudo generar el menú.');
    } finally {
      setGenerating(false);
    }
  }

  async function regenerateMeal(index: number) {
    if (!meals) return;
    setRegeneratingIndex(index);
    setMenuError(null);
    try {
      const avoidNames = meals.map((m) => m.name);
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
      if (!response.ok) throw new Error(data.error ?? 'Error desconocido');

      const [newMeal] = data.menu as Meal[];
      setMeals((prev) => prev?.map((m, i) => (i === index ? newMeal : m)) ?? prev);
      setRegenCounts((prev) => ({ ...prev, [index]: (prev[index] ?? 0) + 1 }));
      // El menú cambió: la lista derivada y sus tachados ya no valen.
      setShoppingList(null);
      setCheckedItems(new Set());
      track('comida_regenerada', { veces: (regenCounts[index] ?? 0) + 1 });
    } catch (err) {
      captureError(err, { paso: 'regenerate-meal' });
      setMenuError(err instanceof Error ? err.message : 'No se pudo regenerar la comida.');
    } finally {
      setRegeneratingIndex(null);
    }
  }

  function toggleMeal(index: number) {
    setSelectedMeals((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
    setShoppingList(null);
    setCheckedItems(new Set());
    track('comida_destildada');
  }

  async function goShopping() {
    if (pendingItems.length === 0) return;

    // Si la lista ya está calculada para esta selección, no gastamos otra llamada.
    if (shoppingList) {
      setStep(3);
      return;
    }

    setShoppingLoading(true);
    setMenuError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-shopping-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ items: pendingItems }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Error desconocido');

      setShoppingList(data.categories);
      setCheckedItems(new Set());
      setStep(3);
      track('lista_compras_generada', {
        categorias: data.categories.length,
        items: pendingItems.length,
        comidas_elegidas: chosenMeals.length,
      });
    } catch (err) {
      captureError(err, { paso: 'generate-shopping-list' });
      setMenuError(err instanceof Error ? err.message : 'No se pudo generar la lista de compras.');
    } finally {
      setShoppingLoading(false);
    }
  }

  function toggleShoppingItem(key: string) {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      const total = (shoppingList ?? []).reduce((sum, c) => sum + c.items.length, 0);
      if (total > 0) {
        track('lista_progreso', { tachados: next.size, total });
      }
      return next;
    });
  }

  async function openRecipe(index: number) {
    if (!meals) return;
    const meal = meals[index];
    setRecipeIndex(index);
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
      if (!response.ok) throw new Error(data.error ?? 'Error desconocido');
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
    setRecipeIndex(null);
    setRecipe(null);
    setRecipeError(null);
  }

  async function logout() {
    resetWeek();
    await supabase.auth.signOut();
  }

  if (!fontsLoaded || authLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg }}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (!session) {
    return (
      <>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <AuthScreen theme={theme} mode={mode} toggleMode={toggleMode} />
      </>
    );
  }

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />

      {step === 1 && (
        <IngredientsScreen
          theme={theme}
          mode={mode}
          toggleMode={toggleMode}
          onLogout={logout}
          onGoTo={setStep}
          source={source}
          photoState={photoState}
          detectedCount={detectedCount}
          onCamera={takePhoto}
          onGallery={pickFromLibrary}
          onManual={openManual}
          manualOpen={manualOpen}
          manualText={manualText}
          onManualText={setManualText}
          onManualAdd={handleManualAdd}
          ingredients={ingredients}
          onRemoveIngredient={(i) => setIngredients((prev) => prev.filter((_, j) => j !== i))}
          draft={draft}
          onDraft={setDraft}
          onAddDraft={handleAddDraft}
          restriction={restriction}
          onRestriction={setRestriction}
          otherText={otherText}
          onOtherText={setOtherText}
          generating={generating}
          genError={genError}
          onGenerate={generateMenu}
        />
      )}

      {step === 2 && meals && (
        <MenuScreen
          theme={theme}
          mode={mode}
          toggleMode={toggleMode}
          onNewWeek={resetWeek}
          onGoTo={setStep}
          meals={meals}
          days={DAYS}
          selected={selectedMeals}
          regenCounts={regenCounts}
          regeneratingIndex={regeneratingIndex}
          onToggleMeal={toggleMeal}
          onRegenerate={regenerateMeal}
          onOpenRecipe={openRecipe}
          error={menuError}
          shoppingLoading={shoppingLoading}
          itemCount={pendingItems.length}
          onGoShopping={goShopping}
        />
      )}

      {step === 3 && shoppingList && (
        <ShoppingScreen
          theme={theme}
          mode={mode}
          toggleMode={toggleMode}
          onNewWeek={resetWeek}
          onGoTo={setStep}
          categories={shoppingList}
          checked={checkedItems}
          onToggleItem={toggleShoppingItem}
        />
      )}

      <RecipeModal
        visible={recipeIndex !== null}
        onClose={closeRecipe}
        mealName={recipeIndex !== null ? (meals?.[recipeIndex]?.name ?? '') : ''}
        day={recipeIndex !== null ? DAYS[recipeIndex] : undefined}
        recipe={recipe}
        loading={recipeLoading}
        error={recipeError}
        theme={theme}
      />
    </>
  );
}
