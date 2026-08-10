import { Pressable, StyleSheet, Text, View } from 'react-native';
import Layer from '../components/Layer';
import { PrimaryButton } from '../components/Buttons';
import { BENEFITS, Country, PLANS, PlanId, pricingNote } from '../lib/plans';
import { fonts, radii, Theme } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  country: Country;
  onChangeCountry: () => void;
  picked: PlanId;
  onPick: (id: PlanId) => void;
  onConfirm: () => void;
  confirming: boolean;
  theme: Theme;
};

const CTA: Record<PlanId, string> = {
  free: 'Seguir con el plan gratis',
  mensual: 'Suscribirme por mes',
  anual: 'Suscribirme por año',
};

export default function PlansLayer(props: Props) {
  const { theme } = props;
  const styles = getStyles(theme);

  return (
    <Layer
      visible={props.visible}
      onClose={props.onClose}
      eyebrow="Membresía"
      title="Elegí tu plan"
      theme={theme}
      footer={
        <PrimaryButton
          title={CTA[props.picked]}
          onPress={props.onConfirm}
          loading={props.confirming}
          theme={theme}
        />
      }
    >
      {PLANS.map((plan) => {
        const on = plan.id === props.picked;
        return (
          <Pressable
            key={plan.id}
            onPress={() => props.onPick(plan.id)}
            style={[
              styles.card,
              on
                ? { borderColor: theme.accent, backgroundColor: theme.line14 }
                : { borderColor: theme.line20 },
            ]}
          >
            <View style={styles.cardTop}>
              <Text style={styles.planName}>{plan.name}</Text>
              {/* El precio se enciende en acento solo en el plan elegido. */}
              <Text style={[styles.planPrice, on && { color: theme.accent }]}>{plan.price}</Text>
            </View>
            <Text style={styles.planDesc}>{plan.description}</Text>
            {plan.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{plan.badge}</Text>
              </View>
            )}
          </Pressable>
        );
      })}

      <Text style={styles.sectionTitle}>Con Plus tenés</Text>
      {BENEFITS.map((b, i) => (
        <View key={b} style={styles.benefitRow}>
          <Text style={styles.benefitNum}>{i + 1}</Text>
          <Text style={styles.benefitText}>{b}</Text>
        </View>
      ))}

      <Pressable onPress={props.onChangeCountry} style={styles.countryRow}>
        <View style={styles.countryText}>
          <Text style={styles.countryLabel}>Cobramos en</Text>
          <Text style={styles.countryName}>
            {props.country.name} · {props.country.currency}
          </Text>
        </View>
        <Text style={styles.countryChange}>Cambiar</Text>
      </Pressable>
      <Text style={styles.note}>{pricingNote(props.country)}</Text>

      <Text style={styles.footnote}>
        Se renueva solo. Lo cancelás cuando quieras desde tu perfil.
      </Text>
    </Layer>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      borderWidth: 1,
      borderRadius: radii.card,
      paddingVertical: 15,
      paddingHorizontal: 16,
      marginBottom: 10,
    },
    cardTop: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 12,
    },
    // El nombre del plan es sans, no serif: la serif está reservada para los
    // títulos de pantalla y los nombres de comida.
    planName: {
      fontFamily: fonts.bodySemi,
      fontSize: 18,
      lineHeight: 22,
      letterSpacing: -0.18,
      color: theme.ink,
      flexShrink: 1,
    },
    planPrice: { fontFamily: fonts.bodySemi, fontSize: 17, color: theme.inkSoft },
    planDesc: {
      fontFamily: fonts.body,
      fontSize: 13,
      lineHeight: 20,
      color: theme.inkSoft,
      marginTop: 6,
    },
    badge: {
      alignSelf: 'flex-start',
      marginTop: 10,
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: radii.chip,
      backgroundColor: theme.accent,
    },
    badgeText: { fontFamily: fonts.bodySemi, fontSize: 12, color: theme.accentInk },
    countryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      minHeight: 44,
      marginTop: 18,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: theme.line20,
      borderRadius: radii.btn,
    },
    countryText: { flexShrink: 1 },
    countryLabel: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: theme.inkSoft },
    countryName: {
      fontFamily: fonts.bodySemi,
      fontSize: 14.5,
      color: theme.ink,
      marginTop: 2,
    },
    countryChange: { fontFamily: fonts.bodySemi, fontSize: 13, color: theme.accent },
    note: {
      fontFamily: fonts.body,
      fontSize: 12.5,
      lineHeight: 19,
      color: theme.inkSoft,
      marginTop: 8,
    },
    sectionTitle: {
      fontFamily: fonts.bodySemi,
      fontSize: 15,
      letterSpacing: -0.15,
      color: theme.ink,
      borderBottomWidth: 1,
      borderBottomColor: theme.line20,
      paddingBottom: 8,
      marginTop: 20,
      marginBottom: 4,
    },
    benefitRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.line14,
    },
    benefitNum: {
      fontFamily: fonts.displaySemi,
      fontSize: 13,
      color: theme.accent,
      minWidth: 14,
    },
    benefitText: {
      fontFamily: fonts.body,
      fontSize: 14,
      lineHeight: 21,
      color: theme.ink,
      flexShrink: 1,
    },
    footnote: {
      fontFamily: fonts.body,
      fontSize: 12.5,
      lineHeight: 19,
      color: theme.inkSoft,
      marginTop: 16,
    },
  });
}
