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
              <Text style={styles.planPrice}>{plan.price}</Text>
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

      <View style={styles.countryRow}>
        <Text style={styles.countryText}>
          Cobramos en — {props.country.name} · {props.country.currency}
        </Text>
        <Pressable onPress={props.onChangeCountry} hitSlop={10}>
          <Text style={styles.countryChange}>Cambiar</Text>
        </Pressable>
      </View>
      <Text style={styles.note}>{pricingNote(props.country)}</Text>

      <Text style={styles.sectionTitle}>Con Plus tenés</Text>
      {BENEFITS.map((b, i) => (
        <View key={b} style={styles.benefitRow}>
          <Text style={styles.benefitNum}>{i + 1}</Text>
          <Text style={styles.benefitText}>{b}</Text>
        </View>
      ))}

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
      padding: 16,
      marginBottom: 9,
    },
    cardTop: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 12,
    },
    planName: {
      fontFamily: fonts.displaySemi,
      fontSize: 20,
      color: theme.ink,
      flexShrink: 1,
    },
    planPrice: { fontFamily: fonts.bodySemi, fontSize: 17, color: theme.ink },
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
      marginTop: 16,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: theme.line20,
    },
    countryText: { fontFamily: fonts.body, fontSize: 13.5, color: theme.ink, flexShrink: 1 },
    countryChange: { fontFamily: fonts.bodySemi, fontSize: 13, color: theme.accent },
    note: {
      fontFamily: fonts.body,
      fontSize: 12.5,
      lineHeight: 19,
      color: theme.inkSoft,
      marginTop: 6,
    },
    sectionTitle: {
      fontFamily: fonts.bodySemi,
      fontSize: 15,
      letterSpacing: -0.15,
      color: theme.ink,
      marginTop: 26,
      marginBottom: 12,
    },
    benefitRow: { flexDirection: 'row', gap: 12, marginBottom: 10 },
    benefitNum: {
      fontFamily: fonts.displaySemi,
      fontSize: 18,
      color: theme.accent,
      minWidth: 18,
    },
    benefitText: {
      fontFamily: fonts.body,
      fontSize: 13.5,
      lineHeight: 21,
      color: theme.ink,
      flexShrink: 1,
    },
    footnote: {
      fontFamily: fonts.body,
      fontSize: 12.5,
      lineHeight: 19,
      color: theme.inkSoft,
      marginTop: 20,
    },
  });
}
