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
import { Cross } from '../components/Icons';
import { ALL_MOMENTS, isAllowed } from '../lib/moments';
import { HatchPattern, PopIn, ScreenEntrance, Shake } from '../components/Motion';
import { fonts, radii, Theme } from '../theme';

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
  onOpenProfile: () => void;
  enabledSteps: Step[];
  onGoTo: (step: Step) => void;
  profileName: string;
  profileEmail: string;

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

  /** Momentos elegidos y los que el plan habilita. */
  moments: string[];
  onToggleMoment: (moment: string) => void;
  allowedMoments: string[] | undefined;
  onOpenPlans: () => void;

  generating: boolean;
  genError: string | null;
  onGenerate: () => void;
};

export default function IngredientsScreen(props: Props) {
  const { theme } = props;
  const styles = getStyles(theme);

  const sources: { key: Source; lines: [string, string]; onPress: () => void }[] = [
    { key: 'camera', lines: ['Sacar', 'foto'], onPress: props.onCamera },
    { key: 'gallery', lines: ['De la', 'galería'], onPress: props.onGallery },
    { key: 'manual', lines: ['Escribir', 'a mano'], onPress: props.onManual },
  ];

  return (
    <ScreenEntrance style={styles.root}>
      <View style={styles.top}>
        <Header
          theme={theme}
          onOpenProfile={props.onOpenProfile}
          profileName={props.profileName}
          profileEmail={props.profileEmail}
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
                  { borderColor: theme.line20 },
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
            <HatchPattern ph1={theme.ph1} ph2={theme.ph2} />
            <ActivityIndicator size="small" color={theme.accent} />
            <Text style={styles.photoLoadingText}>Analizando la foto…</Text>
          </View>
        )}

        {props.photoState === 'ok' && (
          <View style={[styles.photoBox, styles.photoOk]}>
            <HatchPattern ph1={theme.ph1} ph2={theme.ph2} />
            <Text style={styles.photoCaption}>foto tomada · heladera</Text>
            <View style={styles.detectedBadge}>
              <Text style={styles.detectedText}>{props.detectedCount} detectados</Text>
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
              <AccentChipButton title="Probar de nuevo" onPress={props.onCamera} theme={theme} />
              <SecondaryButton title="Escribir a mano" onPress={props.onManual} theme={theme} />
            </View>
          </View>
        )}

        {props.manualOpen && (
          <View style={styles.manualBlock}>
            <Text style={styles.manualLabel}>Una por línea, o separadas por coma.</Text>
            <TextInput
              style={styles.textarea}
              placeholder="tomate, fideos, queso…"
              placeholderTextColor={theme.mut60}
              value={props.manualText}
              onChangeText={props.onManualText}
              multiline
            />
            <View style={styles.manualCta}>
              <AccentChipButton
                title="Sumar a la lista"
                onPress={props.onManualAdd}
                theme={theme}
              />
            </View>
          </View>
        )}

        <Eyebrow
          theme={theme}
          rule="soft"
          meta={String(props.ingredients.length)}
          metaTone="accent"
        >
          Tenés en casa
        </Eyebrow>

        {props.ingredients.length === 0 ? (
          <Text style={styles.emptyList}>
            Todavía no hay nada. Sacá una foto o agregá el primero acá abajo.
          </Text>
        ) : (
          <View style={styles.chips}>
            {props.ingredients.map((item, i) => (
              <PopIn key={`${item}-${i}`}>
                <Pressable onPress={() => props.onRemoveIngredient(i)} style={styles.chip}>
                  <Text style={styles.chipText}>{item}</Text>
                  <Cross size={14} color={theme.accent} />
                </Pressable>
              </PopIn>
            ))}
          </View>
        )}

        <View style={styles.addRow}>
          <Text style={styles.addPlus}>+</Text>
          <TextInput
            style={styles.addInput}
            placeholder="Ej: crema de maní"
            placeholderTextColor={theme.mut60}
            value={props.draft}
            onChangeText={props.onDraft}
            onSubmitEditing={props.onAddDraft}
          />
          <Pressable onPress={props.onAddDraft} hitSlop={10}>
            <Text style={styles.addCta}>Agregar</Text>
          </Pressable>
        </View>

        <Eyebrow
          theme={theme}
          rule="soft"
          meta="guardadas en tu perfil"
          onMeta={props.onOpenProfile}
        >
          Restricciones
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
                  { borderColor: theme.line20 },
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
              placeholderTextColor={theme.mut60}
              value={props.otherText}
              onChangeText={props.onOtherText}
            />
          </View>
        )}

        <Eyebrow theme={theme} rule="soft">
          Comidas del día
        </Eyebrow>
        <Text style={styles.momentNote}>
          Cada una se pide aparte, así que elegí las que vas a cocinar.
        </Text>
        <View style={styles.chips}>
          {ALL_MOMENTS.map((moment) => {
            const allowed = isAllowed(moment, props.allowedMoments);
            const active = allowed && props.moments.includes(moment);
            return (
              <Pressable
                key={moment}
                // Bloqueado no es "no hace nada": lleva a donde se desbloquea.
                onPress={() => (allowed ? props.onToggleMoment(moment) : props.onOpenPlans())}
                style={[
                  styles.pill,
                  { borderColor: theme.line20 },
                  active && { backgroundColor: theme.accent },
                  !allowed && styles.pillLocked,
                ]}
              >
                <Text style={[styles.pillText, active && { color: theme.accentInk }]}>
                  {moment}
                </Text>
                {!allowed && <Text style={styles.pillLockedTag}>Plus</Text>}
              </Pressable>
            );
          })}
        </View>

        {props.genError && (
          <Shake trigger={props.genError}>
            <View style={styles.errorBlock}>
              <Text style={styles.errorText}>{props.genError}</Text>
            </View>
          </Shake>
        )}
      </ScrollView>

      <CtaBar theme={theme}>
        <PrimaryButton
          title={props.generating ? 'Armando tu semana…' : 'Generar menú semanal'}
          onPress={props.onGenerate}
          loading={props.generating}
          disabled={props.ingredients.length === 0}
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
    // Deja lugar al CTA, que va superpuesto para que el contenido se
    // desvanezca por debajo en lugar de cortarse.
    scrollBody: { paddingHorizontal: 26, paddingBottom: 104 },
    title: {
      fontFamily: fonts.displaySemi,
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
      borderRadius: radii.btnSecondary,
      alignItems: 'center',
    },
    sourceText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
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
      fontFamily: fonts.bodyMedium,
      fontSize: 12,
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
      fontFamily: fonts.displaySemi,
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
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: theme.inkSoft,
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
      borderColor: theme.line20,
      borderRadius: radii.chip,
      paddingVertical: 7,
      paddingHorizontal: 15,
      // El handoff pide 44px de alto mínimo: es el área táctil accesible.
      minHeight: 44,
    },
    chipText: { fontFamily: fonts.body, fontSize: 13, color: theme.ink },
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
      fontSize: 13,
      color: theme.accent,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 7,
      paddingHorizontal: 13,
      borderWidth: 1,
      borderRadius: radii.chip,
    },
    pillText: { fontFamily: fonts.body, fontSize: 12.5, color: theme.ink },
    // Atenuada pero legible: tiene que leerse qué te estás perdiendo.
    pillLocked: { opacity: 0.55 },
    pillLockedTag: {
      fontFamily: fonts.bodySemi,
      fontSize: 10.5,
      color: theme.accent,
    },
    momentNote: {
      fontFamily: fonts.body,
      fontSize: 12.5,
      lineHeight: 18,
      color: theme.inkSoft,
      marginBottom: 10,
    },
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
