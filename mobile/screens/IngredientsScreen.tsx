import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AccentChipButton, PrimaryButton, SecondaryButton } from '../components/Buttons';
import { CtaBar, Eyebrow, Header, StepIndicator, Step } from '../components/Chrome';
import { CrossMark } from '../components/Glyphs';
import { fonts, radii, Mode, Theme } from '../theme';

export type PhotoState = 'none' | 'loading' | 'ok' | 'empty';
export type Source = 'camera' | 'gallery' | 'manual' | null;

export const RESTRICTION_OPTIONS = [
  'Ninguna',
  'Vegetariano',
  'Vegano',
  'Sin gluten',
  'Sin lactosa',
  'Otros',
] as const;

type Props = {
  theme: Theme;
  mode: Mode;
  toggleMode: () => void;
  onLogout: () => void;
  enabledSteps: Step[];
  onGoTo: (step: Step) => void;

  source: Source;
  photoState: PhotoState;
  detectedCount: number;
  onCamera: () => void;
  onGallery: () => void;
  onManual: () => void;

  manualOpen: boolean;
  manualText: string;
  onManualText: (v: string) => void;
  onManualAdd: () => void;

  ingredients: string[];
  onRemoveIngredient: (index: number) => void;
  draft: string;
  onDraft: (v: string) => void;
  onAddDraft: () => void;

  restriction: string;
  onRestriction: (value: string) => void;
  otherText: string;
  onOtherText: (v: string) => void;

  generating: boolean;
  genError: string | null;
  onGenerate: () => void;
};

export default function IngredientsScreen(props: Props) {
  const { theme } = props;
  const styles = getStyles(theme);

  const sources: { key: Source; lines: [string, string]; onPress: () => void }[] = [
    { key: 'camera', lines: ['SACAR', 'FOTO'], onPress: props.onCamera },
    { key: 'gallery', lines: ['DE LA', 'GALERÍA'], onPress: props.onGallery },
    { key: 'manual', lines: ['ESCRIBIR', 'A MANO'], onPress: props.onManual },
  ];

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <Header
          theme={theme}
          mode={props.mode}
          toggleMode={props.toggleMode}
          actionLabel="SALIR"
          onAction={props.onLogout}
        />
        <StepIndicator theme={theme} current={1} enabled={props.enabledSteps} onGoTo={props.onGoTo} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollBody}>
        <Text style={styles.title}>¿Qué hay en{'\n'}tu heladera?</Text>
        <Text style={styles.subtitle}>Una foto alcanza. Si preferís, escribila.</Text>

        <View style={styles.sourceGrid}>
          {sources.map((s) => {
            const active = props.source === s.key;
            return (
              <Pressable
                key={s.key}
                onPress={s.onPress}
                style={[
                  styles.sourceBtn,
                  { borderColor: theme.border },
                  active && { backgroundColor: theme.accent },
                ]}
              >
                <Text style={[styles.sourceText, active && { color: theme.accentInk }]}>
                  {s.lines[0]}
                </Text>
                <Text style={[styles.sourceText, active && { color: theme.accentInk }]}>
                  {s.lines[1]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {props.photoState === 'loading' && (
          <View style={[styles.photoBox, styles.photoCentered]}>
            <ActivityIndicator size="small" color={theme.accent} />
            <Text style={styles.photoLoadingText}>Analizando la foto…</Text>
          </View>
        )}

        {props.photoState === 'ok' && (
          <View style={[styles.photoBox, styles.photoOk]}>
            <Text style={styles.photoCaption}>foto tomada · heladera</Text>
            <View style={styles.detectedBadge}>
              <Text style={styles.detectedText}>{props.detectedCount} DETECTADOS</Text>
            </View>
          </View>
        )}

        {props.photoState === 'empty' && (
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyTitle}>No reconocimos nada</Text>
            <Text style={styles.emptyBody}>
              La foto salió muy oscura. Probá de nuevo con la puerta abierta, o escribí la lista a
              mano.
            </Text>
            <View style={styles.emptyActions}>
              <AccentChipButton title="PROBAR DE NUEVO" onPress={props.onCamera} theme={theme} />
              <SecondaryButton title="ESCRIBIR A MANO" onPress={props.onManual} theme={theme} />
            </View>
          </View>
        )}

        {props.manualOpen && (
          <View style={styles.manualBlock}>
            <Text style={styles.manualLabel}>ESCRIBILA, UNA POR LÍNEA O SEPARADAS POR COMA</Text>
            <TextInput
              style={styles.textarea}
              placeholder="tomate, fideos, queso…"
              placeholderTextColor={theme.mut75}
              value={props.manualText}
              onChangeText={props.onManualText}
              multiline
            />
            <View style={styles.manualCta}>
              <AccentChipButton
                title="SUMAR A LA LISTA"
                onPress={props.onManualAdd}
                theme={theme}
              />
            </View>
          </View>
        )}

        <Eyebrow
          theme={theme}
          rule="soft"
          meta={`${props.ingredients.length} ${props.ingredients.length === 1 ? 'ítem' : 'ítems'}`}
        >
          TENÉS EN CASA
        </Eyebrow>

        {props.ingredients.length === 0 ? (
          <Text style={styles.emptyList}>
            Todavía no hay nada. Sacá una foto o agregá el primero acá abajo.
          </Text>
        ) : (
          <View style={styles.chips}>
            {props.ingredients.map((item, i) => (
              <Pressable
                key={`${item}-${i}`}
                onPress={() => props.onRemoveIngredient(i)}
                style={styles.chip}
              >
                <Text style={styles.chipText}>{item}</Text>
                <CrossMark size={9} color={theme.accent} thickness={1.5} />
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.addRow}>
          <Text style={styles.addPlus}>+</Text>
          <TextInput
            style={styles.addInput}
            placeholder="Ej: crema de maní"
            placeholderTextColor={theme.mut75}
            value={props.draft}
            onChangeText={props.onDraft}
            onSubmitEditing={props.onAddDraft}
          />
          <Pressable onPress={props.onAddDraft} hitSlop={10}>
            <Text style={styles.addCta}>AGREGAR</Text>
          </Pressable>
        </View>

        <Eyebrow theme={theme} rule="soft">
          RESTRICCIONES
        </Eyebrow>
        <View style={styles.chips}>
          {RESTRICTION_OPTIONS.map((option) => {
            const active = props.restriction === option;
            return (
              <Pressable
                key={option}
                onPress={() => props.onRestriction(option)}
                style={[
                  styles.pill,
                  { borderColor: theme.border },
                  active && { backgroundColor: theme.accent },
                ]}
              >
                <Text style={[styles.pillText, active && { color: theme.accentInk }]}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {props.restriction === 'Otros' && (
          <View style={styles.otherRow}>
            <TextInput
              style={styles.addInput}
              placeholder="Ej: sin frutos secos"
              placeholderTextColor={theme.mut75}
              value={props.otherText}
              onChangeText={props.onOtherText}
            />
          </View>
        )}

        {props.genError && (
          <View style={styles.errorBlock}>
            <Text style={styles.errorText}>{props.genError}</Text>
          </View>
        )}
      </ScrollView>

      <CtaBar theme={theme}>
        <PrimaryButton
          title={props.generating ? 'ARMANDO TU SEMANA…' : 'GENERAR MENÚ SEMANAL'}
          onPress={props.onGenerate}
          loading={props.generating}
          disabled={props.ingredients.length === 0}
          theme={theme}
        />
      </CtaBar>
    </View>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg, paddingTop: 52 },
    top: { paddingHorizontal: 26 },
    scroll: { flex: 1 },
    scrollBody: { paddingHorizontal: 26, paddingBottom: 14 },
    title: {
      fontFamily: fonts.display,
      fontSize: 32,
      lineHeight: 34,
      letterSpacing: -0.48,
      color: theme.ink,
      marginTop: 14,
      marginBottom: 2,
    },
    subtitle: {
      fontFamily: fonts.body,
      fontSize: 14,
      lineHeight: 22,
      color: theme.inkSoft,
      marginBottom: 12,
    },
    sourceGrid: { flexDirection: 'row', gap: 8, marginBottom: 14 },
    sourceBtn: {
      flex: 1,
      paddingVertical: 11,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderRadius: radii.btn,
      alignItems: 'center',
    },
    sourceText: {
      fontFamily: fonts.bodySemi,
      fontSize: 10,
      letterSpacing: 1.2,
      color: theme.ink,
    },
    photoBox: {
      height: 112,
      borderRadius: radii.photo,
      backgroundColor: theme.ph1,
      marginBottom: 16,
      overflow: 'hidden',
    },
    photoCentered: { alignItems: 'center', justifyContent: 'center', gap: 12 },
    photoOk: { justifyContent: 'flex-end', padding: 12 },
    photoLoadingText: { fontFamily: fonts.body, fontSize: 12, color: theme.inkSoft },
    photoCaption: { fontFamily: fonts.body, fontSize: 10, color: theme.inkSoft },
    detectedBadge: {
      position: 'absolute',
      top: 10,
      right: 10,
      paddingVertical: 5,
      paddingHorizontal: 9,
      backgroundColor: theme.accent,
      borderRadius: 2,
    },
    detectedText: {
      fontFamily: fonts.bodySemi,
      fontSize: 9,
      letterSpacing: 1.26,
      color: theme.accentInk,
    },
    emptyBlock: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radii.photo,
      padding: 16,
      marginBottom: 16,
    },
    emptyTitle: {
      fontFamily: fonts.display,
      fontSize: 17,
      lineHeight: 22,
      color: theme.ink,
      marginBottom: 6,
    },
    emptyBody: {
      fontFamily: fonts.body,
      fontSize: 13,
      lineHeight: 20,
      color: theme.inkSoft,
      marginBottom: 12,
    },
    emptyActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    manualBlock: { marginBottom: 16 },
    manualLabel: {
      fontFamily: fonts.bodySemi,
      fontSize: 9.5,
      letterSpacing: 1.9,
      color: theme.accent,
      marginBottom: 7,
    },
    textarea: {
      height: 74,
      paddingVertical: 11,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radii.field,
      backgroundColor: theme.surface,
      fontFamily: fonts.body,
      fontSize: 14,
      lineHeight: 21,
      color: theme.ink,
      textAlignVertical: 'top',
    },
    manualCta: { marginTop: 8, alignSelf: 'flex-start' },
    emptyList: {
      fontFamily: fonts.body,
      fontSize: 13.5,
      lineHeight: 20,
      color: theme.inkSoft,
      marginBottom: 10,
    },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 10 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      backgroundColor: theme.chipBg,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radii.chip,
      paddingVertical: 7,
      paddingHorizontal: 13,
    },
    chipText: { fontFamily: fonts.body, fontSize: 13.5, color: theme.ink },
    addRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      paddingBottom: 8,
      marginBottom: 16,
    },
    addPlus: { fontFamily: fonts.body, fontSize: 15, color: theme.accent },
    addInput: { flex: 1, fontFamily: fonts.body, fontSize: 14.5, color: theme.ink, paddingVertical: 4 },
    addCta: {
      fontFamily: fonts.bodySemi,
      fontSize: 10,
      letterSpacing: 1.4,
      color: theme.accent,
    },
    pill: {
      paddingVertical: 7,
      paddingHorizontal: 13,
      borderWidth: 1,
      borderRadius: radii.chip,
    },
    pillText: { fontFamily: fonts.body, fontSize: 12.5, color: theme.ink },
    otherRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      paddingBottom: 8,
      marginTop: 12,
    },
    errorBlock: {
      marginTop: 16,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: theme.accent,
      borderRadius: radii.field,
    },
    errorText: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: theme.accent },
  });
}
