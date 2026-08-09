import { ReactNode, useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';

/**
 * Los `@keyframes` del prototipo, traducidos a la API `Animated`. Todo usa
 * `useNativeDriver` porque solo anima opacidad y transformaciones.
 */

type EntranceProps = {
  children: ReactNode;
  /** El ingreso entra en 400ms; el resto del flujo en 350ms. */
  duration?: number;
  style?: ViewStyle;
};

/** Entrada de pantalla: 6px de traslación vertical + fade. */
export function ScreenEntrance({ children, duration = 350, style }: EntranceProps) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(t, { toValue: 1, duration, useNativeDriver: true }).start();
  }, [t, duration]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: t,
          transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Aparición de un chip: escala 0.82 → 1.06 → 1 en 220ms. */
export function PopIn({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const s = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(s, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [s]);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [
            { scale: s.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.82, 1.06, 1] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Sacudida horizontal de 300ms, disparada cada vez que cambia `trigger`. */
export function Shake({
  children,
  trigger,
  style,
}: {
  children: ReactNode;
  trigger: string | number | null;
  style?: ViewStyle;
}) {
  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (trigger === null || trigger === '') return;
    x.setValue(0);
    Animated.timing(x, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [trigger, x]);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [
            {
              translateX: x.interpolate({
                inputRange: [0, 0.25, 0.75, 1],
                outputRange: [0, -4, 4, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/**
 * Trama diagonal del placeholder de foto. React Native no tiene
 * `repeating-linear-gradient`, así que se dibuja con barras rotadas.
 */
export function HatchPattern({ ph1, ph2 }: { ph1: string; ph2: string }) {
  // A 45°, para bandas de 8px con período de 16px medidos en perpendicular,
  // el ancho y el paso horizontales se multiplican por √2.
  const BAR_WIDTH = 8 * Math.SQRT2;
  const STEP = 16 * Math.SQRT2;
  const OVERHANG = 220;
  const COVER = 720;

  const bars: number[] = [];
  for (let x = -OVERHANG; x < COVER; x += STEP) bars.push(x);

  return (
    <View style={[StyleSheet.absoluteFill, styles.hatch, { backgroundColor: ph1 }]}>
      {bars.map((x) => (
        <View
          key={x}
          style={{
            position: 'absolute',
            left: x,
            top: -OVERHANG,
            width: BAR_WIDTH,
            height: COVER,
            backgroundColor: ph2,
            transform: [{ rotate: '45deg' }],
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  hatch: { overflow: 'hidden' },
});
