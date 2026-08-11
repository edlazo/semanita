import { Pressable, StyleSheet, View } from 'react-native';
import { Check } from './Icons';
import { radii, Theme } from '../theme';

type Props = {
  checked: boolean;
  /** Omitir cuando un Pressable padre ya maneja el toque: evita el doble toggle en web. */
  onPress?: () => void;
  size?: number;
  /** Redonda en el menú, casi cuadrada en la lista: se distinguen a propósito. */
  shape?: 'meal' | 'shopping';
  theme: Theme;
};

export default function Checkbox({
  checked,
  onPress,
  size = 22,
  shape = 'meal',
  theme,
}: Props) {
  const box = [
    styles.box,
    {
      width: size,
      height: size,
      borderRadius: shape === 'meal' ? radii.checkMeal : radii.checkShopping,
      borderColor: checked ? theme.accent : theme.mut60,
      backgroundColor: checked ? theme.accent : 'transparent',
    },
  ];
  // El icono tiene que entrar dentro del borde de 1.5px, no medir lo mismo que
  // la casilla. 0.82 deja aire a los cuatro lados y el tilde queda cerca de la
  // mitad del ancho; trazo 2 sobre 24 se dibuja en ~1.5px a estos tamaños.
  const mark = checked ? (
    <Check size={size * 0.82} color={theme.accentInk} strokeWidth={2} />
  ) : null;

  if (!onPress) {
    return <View style={box}>{mark}</View>;
  }

  // hitSlop lleva el área tocable real a 44x44 sin agrandar la casilla.
  const slop = Math.max(0, (44 - size) / 2);
  return (
    <Pressable onPress={onPress} hitSlop={slop} style={box}>
      {mark}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    // `flex: 0` compila a `flex: 0 1 0%`: base cero y encogible, así que en una
    // fila la casilla colapsa. flexShrink solo evita que se achique.
    flexShrink: 0,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
