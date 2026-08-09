import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Newsreader_400Regular_Italic,
  Newsreader_600SemiBold,
  Newsreader_700Bold,
} from '@expo-google-fonts/newsreader';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import AuthScreen from './components/AuthScreen';
import RecipeModal, { Recipe } from './components/RecipeModal';
import { Step } from './components/Chrome';
import IngredientsScreen, { PhotoState, Source } from './screens/IngredientsScreen';
import MenuScreen, { Meal } from './screens/MenuScreen';
import ShoppingScreen from './screens/ShoppingScreen';
import PaywallScreen from './screens/PaywallScreen';
import { Entitlement, showRewardedAd, startSubscription, trialLabel } from './lib/plan';
import ProfileModal from './components/ProfileModal';
import AdGateModal from './components/AdGateModal';
import {
  checkedNamesFrom,
  needsCategorization,
  ShoppingCategory,
  visibleCategories,
} from './lib/shopping';
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
    Newsreader_400Regular_Italic,
    Newsreader_600SemiBold,
    Newsreader_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setDisplayName((data.session?.user.user_metadata?.name as string) ?? '');
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        identifyUser(newSession.user.id, newSession.user.email ?? undefined);
        setDisplayName((newSession.user.user_metadata?.name as string) ?? '');
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

  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  /** Comida esperando confirmación para regenerar con anuncio. */
  const [adGateIndex, setAdGateIndex] = useState<number | null>(null);
  const [watchingAd, setWatchingAd] = useState(false);

  const effectiveRestrictions =
    restriction === 'Ninguna' ? '' : restriction === 'Otros' ? otherText.trim() : restriction;

  const chosenMeals = (meals ?? []).filter((_, i) => selectedMeals.has(i));
  const pendingItems = [...new Set(chosenMeals.flatMap((m) => m.ingredientsToBuy))];

  const checkedNames = checkedNamesFrom(checkedItems);
  // La lista guardada es la categorización completa; se muestra recortada a lo
  // que las comidas elegidas necesitan ahora.
  const shownCategories = shoppingList ? visibleCategories(shoppingList, pendingItems) : [];

  const storageKey = session ? storageKeyFor(session.user.id) : null;

  // Un paso queda navegable en cuanto tiene datos, hacia adelante también: volver
  // a Ingredientes no debe obligar a regenerar un menú que ya existe.
  const enabledSteps: Step[] = [1];
  if (meals) enabledSteps.push(2);
  if (shownCategories.length > 0) enabledSteps.push(3);

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

  const refreshEntitlement = useCallback(async () => {
    if (!session) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/me`, { headers: await authHeaders() });
      if (!response.ok) return;
      const data = await response.json();
      setEntitlement(data.entitlement);
    } catch (err) {
      // Sin conexión no se bloquea nada: el backend es el que decide de verdad.
      captureError(err, { paso: 'refresh-entitlement' });
    }
  }, [session]);

  useEffect(() => {
    refreshEntitlement();
  }, [refreshEntitlement]);

  /** El 402 del backend significa prueba vencida: se muestra el paywall. */
  function handlePlanBlocked(status: number): boolean {
    if (status !== 402) return false;
    setEntitlement({ status: 'expired', trialDaysLeft: 0, subscribed: false });
    return true;
  }

  async function saveDisplayName(name: string) {
    const { error } = await supabase.auth.updateUser({ data: { name } });
    if (error) {
      captureError(error, { paso: 'guardar-nombre' });
      return;
    }
    setDisplayName(name);
  }

  async function subscribe() {
    setSubscribing(true);
    setPlanError(null);
    try {
      const ok = await startSubscription();
      if (!ok) {
        setPlanError(
          'Todavía no está habilitado el cobro: falta publicar la app en las tiendas. Escribinos y te damos acceso mientras tanto.'
        );
        return;
      }
      await refreshEntitlement();
    } finally {
      setSubscribing(false);
    }
  }

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
      if (!response.ok) {
        if (handlePlanBlocked(response.status)) return;
        throw new Error(data.error ?? 'Error desconocido');
      }

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
      if (!response.ok) {
        if (handlePlanBlocked(response.status)) return;
        throw new Error(data.error ?? 'Error desconocido');
      }

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

  /**
   * Regenerar es la acción repetida: se cobra con un anuncio a quien no paga,
   * en vez de cobrarle al primer uso, que es donde se juega la retención.
   * Con suscripción va directo, sin diálogo.
   */
  function requestRegenerate(index: number) {
    if (entitlement?.subscribed) {
      regenerateMeal(index);
      return;
    }
    setAdGateIndex(index);
  }

  async function confirmAdAndRegenerate() {
    const index = adGateIndex;
    if (index === null) return;
    setWatchingAd(true);
    try {
      const vio = await showRewardedAd();
      if (!vio) {
        setMenuError('Necesitás ver el anuncio completo para regenerar esta comida.');
        return;
      }
      track('anuncio_visto', { motivo: 'regenerar' });
      setAdGateIndex(null);
      await regenerateMeal(index);
    } finally {
      setWatchingAd(false);
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
      if (!response.ok) {
        if (handlePlanBlocked(response.status)) return;
        throw new Error(data.error ?? 'Error desconocido');
      }

      const [newMeal] = data.menu as Meal[];
      setMeals((prev) => prev?.map((m, i) => (i === index ? newMeal : m)) ?? prev);
      setRegenCounts((prev) => ({ ...prev, [index]: (prev[index] ?? 0) + 1 }));
      // No se toca la lista: los ingredientes nuevos de esta comida quedan sin
      // categorizar y eso solo dispara el pedido cuando el usuario vaya a compras.
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
    // La lista y los tachados se conservan: la vista se recorta sola a lo que
    // sigue haciendo falta, y volver a tildar la comida recupera el progreso.
    track('comida_destildada');
  }

  async function goShopping() {
    if (pendingItems.length === 0) return;

    // Sólo se le pide a Gemini que categorice si aparecieron ítems nuevos.
    if (!needsCategorization(shoppingList, pendingItems)) {
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
      if (!response.ok) {
        if (handlePlanBlocked(response.status)) return;
        throw new Error(data.error ?? 'Error desconocido');
      }

      // Los tachados sobreviven: están indexados por categoría e ítem, así que
      // recategorizar no debería perder lo que ya compraste.
      setShoppingList(data.categories);
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
      if (!response.ok) {
        if (handlePlanBlocked(response.status)) return;
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

  if (entitlement?.status === 'expired') {
    return (
      <>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <PaywallScreen
          theme={theme}
          mode={mode}
          toggleMode={toggleMode}
          onLogout={logout}
          onSubscribe={subscribe}
          subscribing={subscribing}
          error={planError}
        />
      </>
    );
  }

  const planLabel = trialLabel(entitlement);

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />

      {step === 1 && (
        <IngredientsScreen
          theme={theme}
          mode={mode}
          toggleMode={toggleMode}
          onOpenProfile={() => setProfileOpen(true)}
          enabledSteps={enabledSteps}
          onGoTo={setStep}
          planLabel={planLabel}
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
          onOpenProfile={() => setProfileOpen(true)}
          enabledSteps={enabledSteps}
          onGoTo={setStep}
          planLabel={planLabel}
          regenNeedsAd={!entitlement?.subscribed}
          meals={meals}
          days={DAYS}
          selected={selectedMeals}
          regenCounts={regenCounts}
          regeneratingIndex={regeneratingIndex}
          onToggleMeal={toggleMeal}
          onRegenerate={requestRegenerate}
          onOpenRecipe={openRecipe}
          error={menuError}
          shoppingLoading={shoppingLoading}
          checkedNames={checkedNames}
          itemCount={pendingItems.length}
          onGoShopping={goShopping}
        />
      )}

      {step === 3 && shownCategories.length > 0 && (
        <ShoppingScreen
          theme={theme}
          mode={mode}
          toggleMode={toggleMode}
          onNewWeek={resetWeek}
          onOpenProfile={() => setProfileOpen(true)}
          enabledSteps={enabledSteps}
          onGoTo={setStep}
          planLabel={planLabel}
          categories={shownCategories}
          checked={checkedItems}
          onToggleItem={toggleShoppingItem}
          onBackToMenu={() => setStep(2)}
        />
      )}

      <AdGateModal
        visible={adGateIndex !== null}
        onCancel={() => setAdGateIndex(null)}
        onWatch={confirmAdAndRegenerate}
        onSubscribe={() => {
          setAdGateIndex(null);
          setProfileOpen(true);
        }}
        loading={watchingAd}
        mealName={adGateIndex !== null ? (meals?.[adGateIndex]?.name ?? '') : ''}
        theme={theme}
      />

      <ProfileModal
        visible={profileOpen}
        onClose={() => setProfileOpen(false)}
        email={session.user.email ?? ''}
        name={displayName}
        onSaveName={saveDisplayName}
        entitlement={entitlement}
        onSubscribe={subscribe}
        subscribing={subscribing}
        onLogout={() => {
          setProfileOpen(false);
          logout();
        }}
        theme={theme}
      />

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
