import { StyleSheet, View } from 'react-native';

/**
 * Karla no incluye ✓ (U+2713) ni ✕ (U+2715). En el navegador eso se disimula
 * porque sustituye la fuente, pero con una fuente cargada por archivo el glifo
 * faltante no se dibuja. Los dibujamos con Views para no depender de la fuente.
 */

type Props = {
  size: number;
  color: string;
  thickness?: number;
};

export function CheckMark({ size, color, thickness = 2 }: Props) {
  return (
    <View
      style={{
        width: size * 0.32,
        height: size * 0.58,
        borderRightWidth: thickness,
        borderBottomWidth: thickness,
        borderColor: color,
        transform: [{ rotate: '45deg' }],
        // Compensa el desplazamiento que genera la rotación sobre el centro.
        marginTop: -size * 0.1,
      }}
    />
  );
}

export function CrossMark({ size, color, thickness = 1.5 }: Props) {
  const bar = {
    position: 'absolute' as const,
    width: size,
    height: thickness,
    borderRadius: thickness,
    backgroundColor: color,
  };
  return (
    <View style={[styles.crossBox, { width: size, height: size }]}>
      <View style={[bar, { transform: [{ rotate: '45deg' }] }]} />
      <View style={[bar, { transform: [{ rotate: '-45deg' }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  crossBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
