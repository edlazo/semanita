import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, SecondaryButton } from './Buttons';
import { CrossMark } from './Glyphs';
import { HatchPattern } from './Motion';
import { fonts, radii, Theme } from '../theme';

/** Duración del anuncio simulado. La reemplaza el SDK cuando exista. */
const AD_SECONDS = 15;
/** Antes de esto no hay salida: un anuncio salteable al instante no es un anuncio. */
const SKIP_AFTER = 5;

type Props = {
  visible: boolean;
  mealName: string;
  onCancel: () => void;
  /** Se llama solo si el anuncio llegó al final: saltear no regenera. */
  onRewarded: () => void;
  onSubscribe: () => void;
  theme: Theme;
};

export default function AdGateModal(props: Props) {
  const { theme } = props;
  const styles = getStyles(theme);

  const [phase, setPhase] = useState<'offer' | 'playing'>('offer');
  const [left, setLeft] = useState(AD_SECONDS);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopTimer() {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }

  useEffect(() => {
    if (!props.visible) {
      stopTimer();
      setPhase('offer');
      setLeft(AD_SECONDS);
    }
    return stopTimer;
  }, [props.visible]);

  function play() {
    setPhase('playing');
    setLeft(AD_SECONDS);
    timer.current = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          stopTimer();
          // La recompensa se otorga al terminar, no al cerrarse la hoja.
          props.onRewarded();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  function cancel() {
    stopTimer();
    props.onCancel();
  }

  const elapsed = AD_SECONDS - left;
  const canSkip = elapsed >= SKIP_AFTER;

  return (
    <Modal visible={props.visible} animationType="fade" transparent onRequestClose={cancel}>
      {/* Hoja inferior, no pantalla completa: la comida que se va a cambiar
          tiene que seguir visible detrás. */}
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropFill} onPress={phase === 'offer' ? cancel : undefined} />
        <View style={styles.sheet}>
          {phase === 'offer' ? (
            <>
              <View style={styles.headRow}>
                <Text style={styles.eyebrow}>Cambiar comida</Text>
                <Pressable onPress={cancel} hitSlop={12} accessibilityLabel="Cerrar">
                  <CrossMark size={13} color={theme.inkSoft} thickness={1.5} />
                </Pressable>
              </View>

              <Text style={styles.title}>Mirá un anuncio y te la cambio</Text>
              <Text style={styles.body}>
                Son {AD_SECONDS} segundos. Después te propongo otra cosa en lugar de{' '}
                <Text style={styles.bodyStrong}>{props.mealName}</Text>.
              </Text>

              <View style={styles.actions}>
                <PrimaryButton title="Ver el anuncio" onPress={play} theme={theme} />
                <SecondaryButton
                  title="Con Plus no hay anuncios"
                  onPress={props.onSubscribe}
                  fullWidth
                  theme={theme}
                />
              </View>
            </>
          ) : (
            <>
              <View style={styles.headRow}>
                <Text style={styles.eyebrow}>Anuncio</Text>
                <Text style={styles.countdown}>{left}s</Text>
              </View>

              <View style={styles.adSlot}>
                <HatchPattern ph1={theme.ph1} ph2={theme.ph2} />
                <Text style={styles.adSlotText}>espacio publicitario</Text>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFill, { width: `${(elapsed / AD_SECONDS) * 100}%` }]}
                />
              </View>

              <Text style={[styles.body, styles.bodyCentered]}>
                Al terminar te propongo otra comida.
              </Text>

              {canSkip && (
                <Pressable onPress={cancel} hitSlop={8} style={styles.skip}>
                  <Text style={styles.skipText}>Saltear y dejar la comida como está</Text>
                </Pressable>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(20,17,16,0.55)', justifyContent: 'flex-end' },
    backdropFill: { flex: 1 },
    sheet: {
      backgroundColor: theme.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 26,
      paddingTop: 20,
      paddingBottom: 30,
    },
    headRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    eyebrow: { fontFamily: fonts.bodyMedium, fontSize: 13, color: theme.accent },
    countdown: { fontFamily: fonts.bodySemi, fontSize: 13, color: theme.inkSoft },
    title: {
      fontFamily: fonts.displaySemi,
      fontSize: 25,
      lineHeight: 29,
      letterSpacing: -0.38,
      color: theme.ink,
      marginBottom: 8,
    },
    body: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 21, color: theme.inkSoft },
    bodyStrong: { fontFamily: fonts.bodySemi, color: theme.ink },
    bodyCentered: { textAlign: 'center' },
    actions: { marginTop: 20, gap: 10 },
    adSlot: {
      height: 150,
      borderRadius: radii.empty,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    adSlotText: { fontFamily: fonts.body, fontSize: 12.5, color: theme.inkSoft },
    progressTrack: { height: 3, backgroundColor: theme.line20, marginBottom: 12 },
    progressFill: { height: 3, backgroundColor: theme.accent },
    skip: { marginTop: 16, alignSelf: 'center' },
    skipText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: theme.inkSoft },
  });
}
