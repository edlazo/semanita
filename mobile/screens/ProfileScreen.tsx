import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import { Avatar } from '../components/Chrome';
import { ScreenEntrance } from '../components/Motion';
import { Entitlement } from '../lib/plan';
import { Country } from '../lib/plans';
import { fonts, radii, Theme } from '../theme';

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
  notifs: Notifs;
  onToggleNotif: (key: keyof Notifs) => void;
  onEditData: () => void;
  onOpenPlans: () => void;
  onOpenCountry: () => void;
  onLogout: () => void;
  theme: Theme;
};

export default function ProfileScreen(props: Props) {
  const { theme, entitlement } = props;
  const s = getStyles(theme);

  const subscribed = entitlement?.subscribed ?? false;
  const daysLeft = entitlement?.trialDaysLeft ?? 0;
  const dayNumber = Math.max(1, props.trialDays - daysLeft + 1);
  const progress = Math.min(1, dayNumber / props.trialDays);

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
          <Text style={s.brand}>Semanita</Text>
          <Pressable onPress={props.onClose} hitSlop={12}>
            <Text style={s.back}>Volver</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={s.body}>
          <View style={s.identity}>
            <Avatar theme={theme} name={props.name} email={props.email} size={76} />
            <View style={s.identityText}>
              <Text style={s.name}>{props.name.trim() || 'Tu perfil'}</Text>
              <Text style={s.email} numberOfLines={1}>
                {props.email}
              </Text>
            </View>
          </View>
          <View style={s.editRow}>
            <SecondaryButton title="Editar" onPress={props.onEditData} theme={theme} />
          </View>

          {/* La tarjeta de membresía cambia de tratamiento según el estado: el
              plan activo es el único bloque de color pleno de la app. */}
          {subscribed ? (
            <View style={[s.member, { backgroundColor: theme.accent }]}>
              <View style={[s.badge, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                <Text style={[s.badgeText, { color: theme.accentInk }]}>Plus</Text>
              </View>
              <Text style={[s.memberTitle, { color: theme.accentInk }]}>Semanita Plus</Text>
              <Text style={[s.memberBody, { color: theme.accentInk }]}>
                Tenés las cuatro comidas del día y cambiás lo que quieras sin anuncios.
              </Text>
              <View style={s.memberCta}>
                <SecondaryButton title="Cambiar de plan" onPress={props.onOpenPlans} theme={theme} />
              </View>
            </View>
          ) : (
            <View style={[s.member, { borderWidth: 1, borderColor: theme.line20 }]}>
              <View style={[s.badge, { backgroundColor: theme.line14 }]}>
                <Text style={[s.badgeText, { color: theme.ink }]}>Prueba</Text>
              </View>
              <Text style={s.memberTitle}>
                {daysLeft === 1 ? 'Último día de prueba' : `Te quedan ${daysLeft} días`}
              </Text>
              <Text style={s.memberBodyMuted}>
                Cuando termine seguís armando la semana, pero solo la cena. Con Plus tenés las
                cuatro comidas del día.
              </Text>
              <View style={s.progressTrack}>
                <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
              </View>
              <Text style={s.progressLabel}>
                Día {dayNumber} de {props.trialDays}
              </Text>
              <View style={s.memberCta}>
                <PrimaryButton title="Ver los planes" onPress={props.onOpenPlans} theme={theme} />
              </View>
            </View>
          )}

          {/* Las estadísticas del handoff se omiten a propósito: manda mostrar
              el bloque entero solo si hay datos, y todavía no los medimos. */}

          <Text style={s.section}>Restricciones</Text>
          <Text style={s.sectionNote}>Se guarda solo. Es lo mismo que ves en Ingredientes.</Text>
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

          <Text style={[s.section, s.spaced]}>Avisos</Text>
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

          <Text style={[s.section, s.spaced]}>País de residencia</Text>
          <Pressable onPress={props.onOpenCountry} style={s.countryRow}>
            <Text style={s.countryName}>
              {props.country.name} · {props.country.currency}
            </Text>
            <Text style={s.countryChange}>Cambiar</Text>
          </Pressable>

          <View style={s.logout}>
            <SecondaryButton title="Cerrar sesión" onPress={props.onLogout} fullWidth theme={theme} />
          </View>
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
    root: { flex: 1, backgroundColor: theme.bg, paddingTop: 56 },
    header: {
      paddingHorizontal: 26,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    brand: {
      fontFamily: fonts.bodyBold,
      fontSize: 16,
      letterSpacing: -0.32,
      color: theme.ink,
    },
    back: { fontFamily: fonts.bodyMedium, fontSize: 13, color: theme.accent },
    body: { paddingHorizontal: 26, paddingTop: 26, paddingBottom: 40 },
    identity: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    identityText: { flexShrink: 1 },
    name: {
      fontFamily: fonts.displaySemi,
      fontSize: 24,
      lineHeight: 27,
      letterSpacing: -0.24,
      color: theme.ink,
    },
    email: { fontFamily: fonts.body, fontSize: 13.5, color: theme.inkSoft, marginTop: 3 },
    editRow: { marginTop: 14, alignItems: 'flex-start' },
    member: {
      borderRadius: radii.membership,
      padding: 18,
      marginTop: 26,
    },
    badge: {
      alignSelf: 'flex-start',
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: radii.chip,
      marginBottom: 10,
    },
    badgeText: { fontFamily: fonts.bodySemi, fontSize: 12 },
    memberTitle: {
      fontFamily: fonts.displaySemi,
      fontSize: 22,
      lineHeight: 26,
      color: theme.ink,
      marginBottom: 6,
    },
    memberBody: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 21 },
    memberBodyMuted: {
      fontFamily: fonts.body,
      fontSize: 13.5,
      lineHeight: 21,
      color: theme.inkSoft,
    },
    progressTrack: { height: 2, backgroundColor: theme.line20, marginTop: 14 },
    progressFill: { height: 2, backgroundColor: theme.accent },
    progressLabel: {
      fontFamily: fonts.body,
      fontSize: 12.5,
      color: theme.inkSoft,
      marginTop: 6,
    },
    memberCta: { marginTop: 14, alignItems: 'flex-start' },
    section: {
      fontFamily: fonts.bodySemi,
      fontSize: 15,
      letterSpacing: -0.15,
      color: theme.ink,
      marginTop: 30,
      marginBottom: 4,
    },
    spaced: { marginTop: 30 },
    sectionNote: {
      fontFamily: fonts.body,
      fontSize: 12.5,
      color: theme.inkSoft,
      marginBottom: 10,
    },
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
      paddingVertical: 12,
      minHeight: 44,
    },
    countryName: { fontFamily: fonts.body, fontSize: 14.5, color: theme.ink, flexShrink: 1 },
    countryChange: { fontFamily: fonts.bodySemi, fontSize: 13, color: theme.accent },
    logout: { marginTop: 36 },
  });
}
