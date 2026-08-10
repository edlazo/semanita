import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SecondaryButton } from '../components/Buttons';
import { Avatar, Eyebrow } from '../components/Chrome';
import { ScreenEntrance } from '../components/Motion';
import { Entitlement } from '../lib/plan';
import { Country } from '../lib/plans';
import { fonts, Mode, radii, Theme } from '../theme';

export type Notifs = { lista: boolean; receta: boolean; semana: boolean };

export const NOTIF_COPY: { key: keyof Notifs; label: string; detail: string }[] = [
  {
    key: 'lista',
    label: 'Recordarme la lista',
    detail: 'El sábado a la mañana, antes de salir a comprar.',
  },
  {
    key: 'receta',
    label: 'Aviso de la comida del día',
    detail: 'A las 18, con la receta de esa noche.',
  },
  {
    key: 'semana',
    label: 'Novedades de Semanita',
    detail: 'Recetas nuevas y cambios. Como mucho, una vez por mes.',
  },
];

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** Fecha real de fin de prueba: el prototipo la trae escrita a mano. */
function trialEndDate(daysLeft: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysLeft);
  return `${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}

/** Pista de 42x24 que se rellena de acento; toda la fila es tocable. */
function Switch({ on, theme }: { on: boolean; theme: Theme }) {
  return (
    <View
      style={[
        styles.track,
        on
          ? { backgroundColor: theme.accent, borderColor: theme.accent }
          : { borderColor: theme.mut60 },
      ]}
    >
      <View
        style={[
          styles.knob,
          { backgroundColor: on ? theme.accentInk : theme.mut60 },
          on && styles.knobOn,
        ]}
      />
    </View>
  );
}

type Props = {
  visible: boolean;
  onClose: () => void;
  name: string;
  email: string;
  entitlement: Entitlement | null;
  trialDays: number;
  country: Country;
  restrictionOptions: readonly string[];
  restriction: string;
  onRestriction: (value: string) => void;
  otherText: string;
  onOtherText: (value: string) => void;
  notifs: Notifs;
  onToggleNotif: (key: keyof Notifs) => void;
  onEditData: () => void;
  onOpenPlans: () => void;
  onOpenCountry: () => void;
  onNewWeek: () => void;
  onLogout: () => void;
  /** El cambio de modo salió del header del flujo y vive acá. */
  mode: Mode;
  toggleMode: () => void;
  theme: Theme;
};

export default function ProfileScreen(props: Props) {
  const { theme, entitlement } = props;
  const s = getStyles(theme);

  const subscribed = entitlement?.subscribed ?? false;
  const daysLeft = entitlement?.trialDaysLeft ?? 0;
  const dayNumber = Math.max(1, props.trialDays - daysLeft + 1);
  const progress = Math.min(1, dayNumber / props.trialDays);
  const endsLabel = `termina el ${trialEndDate(daysLeft)}`;

  // Sobre acento pleno no hay tinta ni gris: todo el texto va en accentInk.
  const ink = subscribed && { color: theme.accentInk };
  const soft = subscribed && { color: theme.accentInk };

  return (
    <Modal
      visible={props.visible}
      animationType="slide"
      transparent={false}
      onRequestClose={props.onClose}
      presentationStyle="fullScreen"
    >
      <ScreenEntrance style={s.root}>
        <View style={s.header}>
          <Pressable onPress={props.onClose} hitSlop={8} style={s.backBtn}>
            <Text style={s.backGlyph}>←</Text>
          </Pressable>
          <Text style={s.headerTitle}>Tu perfil</Text>
          <Pressable onPress={props.toggleMode} hitSlop={12}>
            <Text style={s.modeAction}>
              {props.mode === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={s.body}>
          <View style={s.identity}>
            <Avatar theme={theme} name={props.name} email={props.email} size={76} />
            <View style={s.identityText}>
              <Text style={s.name} numberOfLines={1}>
                {props.name.trim() || 'Tu perfil'}
              </Text>
              <Text style={s.email} numberOfLines={1}>
                {props.email}
              </Text>
            </View>
            <SecondaryButton title="Editar" onPress={props.onEditData} theme={theme} />
          </View>

          {/* La tarjeta cambia de tratamiento según el estado: el plan activo
              se rellena de acento y es el único bloque pleno de la app. */}
          <View
            style={[
              s.member,
              {
                borderColor: subscribed ? theme.accent : theme.line20,
                backgroundColor: subscribed ? theme.accent : theme.surface,
              },
            ]}
          >
            <View style={s.memberTop}>
              <Text style={[s.memberLabel, soft]}>Membresía</Text>
              <View
                style={[
                  s.badge,
                  { backgroundColor: subscribed ? theme.accentInk : theme.line14 },
                ]}
              >
                <Text style={[s.badgeText, { color: subscribed ? theme.accent : theme.ink }]}>
                  {subscribed ? 'Plus' : 'Prueba'}
                </Text>
              </View>
            </View>

            <Text style={[s.memberTitle, ink]}>
              {subscribed
                ? 'Semanita Plus'
                : daysLeft === 1
                  ? 'Último día de prueba'
                  : `Te quedan ${daysLeft} días`}
            </Text>
            <Text style={[s.memberBody, soft]}>
              {subscribed
                ? 'Las cuatro comidas del día, cambios sin anuncios y menús ilimitados.'
                : // El prototipo dice que sin suscripción no podés seguir. Eso
                  // dejó de ser cierto cuando el plan gratis se quedó con la cena.
                  'Cuando termine seguís armando la semana, pero solo la cena. Con Plus tenés las cuatro comidas del día.'}
            </Text>

            {!subscribed && (
              <View style={s.trial}>
                <View style={s.progressTrack}>
                  <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
                </View>
                <View style={s.trialLabels}>
                  <Text style={[s.trialLabel, soft]}>
                    Día {dayNumber} de {props.trialDays}
                  </Text>
                  <Text style={[s.trialLabel, soft]}>{endsLabel}</Text>
                </View>
              </View>
            )}

            <View
              style={[
                s.memberCta,
                { borderTopColor: subscribed ? 'rgba(255,255,255,0.28)' : theme.line20 },
              ]}
            >
              <Pressable
                onPress={props.onOpenPlans}
                style={[
                  s.memberCtaBtn,
                  { backgroundColor: subscribed ? theme.accentInk : theme.accent },
                ]}
              >
                <Text
                  style={[
                    s.memberCtaText,
                    { color: subscribed ? theme.accent : theme.accentInk },
                  ]}
                >
                  {subscribed ? 'Cambiar de plan' : 'Ver los planes'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Las estadísticas del handoff se omiten a propósito: manda mostrar
              el bloque entero solo si hay datos, y todavía no los medimos. */}

          <Eyebrow theme={theme} rule="soft" meta="se guarda solo">
            Restricciones
          </Eyebrow>
          <Text style={s.sectionNote}>
            Las tenemos en cuenta cada vez que armamos tu menú.
          </Text>
          <View style={s.pills}>
            {props.restrictionOptions.map((option) => {
              const on = props.restriction === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => props.onRestriction(option)}
                  style={[
                    s.pill,
                    { borderColor: theme.line20 },
                    on && { backgroundColor: theme.accent },
                  ]}
                >
                  <Text style={[s.pillText, on && { color: theme.accentInk }]}>{option}</Text>
                </Pressable>
              );
            })}
          </View>

          {props.restriction === 'Otros' && (
            <View style={s.otherRow}>
              <TextInput
                style={s.otherInput}
                placeholder="Ej: sin frutos secos"
                placeholderTextColor={theme.mut60}
                value={props.otherText}
                onChangeText={props.onOtherText}
              />
            </View>
          )}

          <Text style={s.section}>Avisos</Text>
          {NOTIF_COPY.map((n) => (
            <Pressable
              key={n.key}
              onPress={() => props.onToggleNotif(n.key)}
              style={s.notifRow}
            >
              <View style={s.notifText}>
                <Text style={s.notifLabel}>{n.label}</Text>
                <Text style={s.notifDetail}>{n.detail}</Text>
              </View>
              <Switch on={props.notifs[n.key]} theme={theme} />
            </Pressable>
          ))}

          <Pressable onPress={props.onOpenCountry} style={s.countryRow}>
            <View style={s.countryText}>
              <Text style={s.countryName}>País de residencia</Text>
              <Text style={s.countryHint}>Define en qué moneda te cobramos.</Text>
            </View>
            <Text style={s.countryChange}>{props.country.currency} ›</Text>
          </Pressable>

          {/* No está en el prototipo, pero es la única forma de tirar la semana
              y arrancar de cero desde que salió del header. */}
          <Pressable onPress={props.onNewWeek} style={s.quietBtn}>
            <Text style={s.quietBtnText}>Empezar una semana nueva</Text>
          </Pressable>
          <Pressable onPress={props.onLogout} style={s.quietBtn}>
            <Text style={s.quietBtnText}>Cerrar sesión</Text>
          </Pressable>
          <Text style={s.footer}>Emporio de comida casera</Text>
        </ScrollView>
      </ScreenEntrance>
    </Modal>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 42,
    height: 24,
    borderRadius: 999,
    borderWidth: 1,
    padding: 2,
    justifyContent: 'center',
  },
  knob: { width: 18, height: 18, borderRadius: 999 },
  knobOn: { alignSelf: 'flex-end' },
});

function getStyles(theme: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg, paddingTop: 52 },
    header: {
      paddingLeft: 14,
      paddingRight: 22,
      paddingBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    backBtn: {
      width: 44,
      height: 44,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backGlyph: { fontFamily: fonts.body, fontSize: 17, color: theme.ink },
    headerTitle: {
      flex: 1,
      fontFamily: fonts.bodyBold,
      fontSize: 16,
      letterSpacing: -0.32,
      color: theme.ink,
    },
    modeAction: { fontFamily: fonts.bodyMedium, fontSize: 13, color: theme.accent },
    body: { paddingHorizontal: 22, paddingBottom: 40 },
    identity: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 8, paddingBottom: 18 },
    identityText: { flex: 1 },
    name: {
      fontFamily: fonts.displaySemi,
      fontSize: 24,
      lineHeight: 27,
      letterSpacing: -0.24,
      color: theme.ink,
    },
    email: { fontFamily: fonts.body, fontSize: 13.5, color: theme.inkSoft, marginTop: 4 },
    member: {
      borderRadius: radii.membership,
      borderWidth: 1,
      padding: 18,
      marginBottom: 18,
    },
    memberTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 11,
    },
    memberLabel: { fontFamily: fonts.bodyMedium, fontSize: 13, color: theme.inkSoft },
    badge: {
      paddingVertical: 5,
      paddingHorizontal: 11,
      borderRadius: radii.chip,
    },
    badgeText: { fontFamily: fonts.bodySemi, fontSize: 12 },
    memberTitle: {
      fontFamily: fonts.displaySemi,
      fontSize: 26,
      lineHeight: 29,
      letterSpacing: -0.39,
      color: theme.ink,
    },
    memberBody: {
      fontFamily: fonts.body,
      fontSize: 13.5,
      lineHeight: 20,
      color: theme.inkSoft,
      marginTop: 7,
    },
    trial: { marginTop: 14 },
    progressTrack: { height: 2, backgroundColor: theme.line20 },
    progressFill: { height: 2, backgroundColor: theme.accent },
    trialLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
      marginTop: 7,
    },
    trialLabel: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: theme.inkSoft },
    memberCta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 15,
      paddingTop: 14,
      borderTopWidth: 1,
    },
    memberCtaBtn: {
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: 17,
      borderRadius: radii.btnSecondary,
    },
    memberCtaText: { fontFamily: fonts.bodySemi, fontSize: 13 },
    section: {
      fontFamily: fonts.bodySemi,
      fontSize: 15,
      letterSpacing: -0.15,
      color: theme.ink,
      borderBottomWidth: 1,
      borderBottomColor: theme.line20,
      paddingBottom: 8,
      marginTop: 24,
      marginBottom: 2,
    },
    sectionNote: {
      fontFamily: fonts.body,
      fontSize: 13,
      lineHeight: 19,
      color: theme.inkSoft,
      marginBottom: 11,
    },
    otherRow: {
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      paddingBottom: 8,
      marginTop: 12,
    },
    otherInput: { fontFamily: fonts.body, fontSize: 14.5, color: theme.ink, minHeight: 28 },
    pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
    pill: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderRadius: radii.chip,
      minHeight: 40,
      justifyContent: 'center',
    },
    pillText: { fontFamily: fonts.body, fontSize: 13, color: theme.ink },
    notifRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.line14,
    },
    notifText: { flexShrink: 1 },
    notifLabel: { fontFamily: fonts.bodyMedium, fontSize: 14.5, color: theme.ink },
    notifDetail: {
      fontFamily: fonts.body,
      fontSize: 12.5,
      lineHeight: 18,
      color: theme.inkSoft,
      marginTop: 2,
    },
    countryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      minHeight: 44,
      paddingVertical: 13,
      marginTop: 22,
      borderTopWidth: 1,
      borderTopColor: theme.line20,
    },
    countryText: { flexShrink: 1 },
    countryName: {
      fontFamily: fonts.bodySemi,
      fontSize: 15,
      letterSpacing: -0.15,
      color: theme.ink,
    },
    countryHint: {
      fontFamily: fonts.body,
      fontSize: 12.5,
      lineHeight: 17,
      color: theme.inkSoft,
      marginTop: 2,
    },
    countryChange: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: theme.accent },
    // Cerrar sesión y tirar la semana no compiten con nada: caja bordeada,
    // texto apagado y centrado.
    quietBtn: {
      marginTop: 12,
      minHeight: 44,
      paddingVertical: 15,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.line20,
      borderRadius: radii.btnSecondary,
    },
    quietBtnText: { fontFamily: fonts.bodySemi, fontSize: 14, color: theme.inkSoft },
    footer: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: theme.inkSoft,
      textAlign: 'center',
      marginTop: 18,
    },
  });
}
