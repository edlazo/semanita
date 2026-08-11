import { StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

/**
 * Los tildes y las flechas no van como caracteres: Plus Jakarta Sans no trae
 * ✓ (U+2713) ni ✕ (U+2715), y cada plataforma sustituye el glifo faltante por
 * el de otra fuente — o no dibuja nada, que es lo que pasaba en web con las
 * familias cargadas por archivo. Acá son trazos, así que se ven igual en todos
 * lados y el grosor no depende de qué fuente resolvió el sistema.
 *
 * Todos los iconos dibujan sobre una caja de 24x24 y escalan con `size`.
 */

type Props = {
  size: number;
  color: string;
  /** Grosor del trazo en unidades del viewBox de 24. */
  strokeWidth?: number;
};

const styles = StyleSheet.create({ icon: { flexShrink: 0 } });

function Icon({ size, color, strokeWidth = 2.4, d }: Props & { d: string }) {
  return (
    // Sin flexShrink el contenedor lo achica en un solo eje y el trazo sale
    // deformado: dentro de una casilla con borde perdía 2px de alto.
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={styles.icon}>
      <Path
        d={d}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** El tilde. Único para la casilla de comida, la lista de compras y el badge. */
export function Check(props: Props) {
  return <Icon {...props} d="M5 12.5 L10 17.5 L19 7" />;
}

export function Cross(props: Props) {
  return <Icon {...props} d="M6 6 L18 18 M18 6 L6 18" />;
}

export function ArrowLeft(props: Props) {
  return <Icon {...props} d="M19 12 H5 M11 6 L5 12 L11 18" />;
}

export function ArrowRight(props: Props) {
  return <Icon {...props} d="M5 12 H19 M13 6 L19 12 L13 18" />;
}

/** El "›" de las filas que abren otra pantalla. */
export function Chevron(props: Props) {
  return <Icon {...props} d="M9.5 5 L16.5 12 L9.5 19" />;
}
