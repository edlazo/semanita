import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { PrimaryButton, SecondaryButton } from './Buttons';
import { CrossMark } from './Glyphs';
import { Entitlement } from '../lib/plan';
import { fonts, radii, Theme } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  email: string;
  name: string;
  onSaveName: (name: string) => Promise<void>;
  entitlement: Entitlement | null;
  onSubscribe: () => void;
  subscribing: boolean;
  onLogout: () => void;
  theme: Theme;
};

function planTitle(e: Entitlement | null): string {
  if (!e) return 'Cargando…';
  if (e.subscribed) return 'Suscripción activa';
  if (e.status === 'expired') return 'Prueba terminada';
  return e.trialDaysLeft === 1 ? 'Último día de prueba' : `Te quedan ${e.trialDaysLeft} días`;
}

function planBody(e: Entitlement | null): string {
  if (!e) return '';
  if (e.subscribed) return 'Regenerás las comidas que quieras, sin anuncios.';
  if (e.status === 'expired') return 'Suscribite para seguir armando tu semana.';
  return 'Después de la prueba vas a necesitar una suscripción para seguir armando la semana.';
}

export default function ProfileModal(props: Props) {
  const { theme } = props;
  const styles = getStyles(theme);

  const [name, setName] = useState(props.name);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Si el perfil se reabre, arranca desde lo que hay guardado y no desde lo
  // que quedó tipeado la vez anterior.
  useEffect(() => {
    if (props.visible) {
      setName(props.name);
      setSaved(false);
    }
  }, [props.visible, props.name]);

  async function save() {
    setSaving(true);
    try {
      await props.onSaveName(name.trim());
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      visible={props.visible}
      animationType="slide"
      transparent={false}
      onRequestClose={props.onClose}
      presentationStyle="fullScreen"
    >
      <View style={styles.sheet}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>TU CUENTA</Text>
            <Text style={styles.title}>{props.name.trim() || 'Tu perfil'}</Text>
          </View>
          <Pressable
            onPress={props.onClose}
            hitSlop={8}
            style={styles.closeBtn}
            accessibilityLabel="Cerrar perfil"
          >
            <CrossMark size={13} color={theme.ink} thickness={1.5} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.sectionLabel}>NOMBRE</Text>
          <TextInput
            style={styles.input}
            placeholder="Cómo querés que te llamemos"
            placeholderTextColor={theme.mut60}
            value={name}
            onChangeText={(v) => {
              setName(v);
              setSaved(false);
            }}
          />
          <View style={styles.saveRow}>
            <SecondaryButton
              title={saving ? 'GUARDANDO…' : saved ? 'GUARDADO' : 'GUARDAR'}
              onPress={save}
              disabled={saving || name.trim() === props.name.trim()}
              theme={theme}
            />
          </View>

          <Text style={[styles.sectionLabel, styles.spaced]}>EMAIL</Text>
          <Text style={styles.readonly}>{props.email}</Text>

          <Text style={[styles.sectionLabel, styles.spaced]}>TU PLAN</Text>
          <View style={styles.planCard}>
            <Text style={styles.planTitle}>{planTitle(props.entitlement)}</Text>
            <Text style={styles.planBody}>{planBody(props.entitlement)}</Text>
            {!props.entitlement?.subscribed && (
              <View style={styles.planCta}>
                <PrimaryButton
                  title="SUSCRIBIRME"
                  onPress={props.onSubscribe}
                  loading={props.subscribing}
                  theme={theme}
                />
              </View>
            )}
          </View>

          <View style={styles.logoutRow}>
            <SecondaryButton title="CERRAR SESIÓN" onPress={props.onLogout} fullWidth theme={theme} />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    sheet: { flex: 1, backgroundColor: theme.surface, paddingTop: 56, paddingBottom: 26 },
    header: {
      paddingHorizontal: 26,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 14,
    },
    headerText: { flexShrink: 1 },
    eyebrow: {
      fontFamily: fonts.bodySemi,
      fontSize: 9.5,
      letterSpacing: 2.09,
      color: theme.accent,
      marginBottom: 10,
    },
    title: {
      fontFamily: fonts.displaySemi,
      fontSize: 30,
      lineHeight: 32,
      letterSpacing: -0.45,
      color: theme.ink,
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
    body: { paddingHorizontal: 26, paddingTop: 26, paddingBottom: 20 },
    sectionLabel: {
      fontFamily: fonts.bodySemi,
      fontSize: 9.5,
      letterSpacing: 2.09,
      color: theme.accent,
      borderBottomWidth: 1,
      borderBottomColor: theme.line26,
      paddingBottom: 6,
      marginBottom: 10,
    },
    spaced: { marginTop: 26 },
    input: {
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      fontFamily: fonts.body,
      fontSize: 15,
      color: theme.ink,
    },
    saveRow: { marginTop: 10, alignItems: 'flex-start' },
    readonly: {
      fontFamily: fonts.body,
      fontSize: 15,
      color: theme.inkSoft,
      paddingVertical: 4,
    },
    planCard: {
      borderWidth: 1,
      borderColor: theme.line20,
      borderRadius: radii.card,
      padding: 16,
      backgroundColor: theme.bg,
    },
    planTitle: {
      fontFamily: fonts.displaySemi,
      fontSize: 19,
      lineHeight: 24,
      color: theme.ink,
      marginBottom: 5,
    },
    planBody: {
      fontFamily: fonts.body,
      fontSize: 13.5,
      lineHeight: 20,
      color: theme.inkSoft,
    },
    planCta: { marginTop: 14 },
    logoutRow: { marginTop: 34 },
  });
}
