import { StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

/**
 * El set de íconos del handoff ("Los checkmarks NO son texto").
 *
 * Nada de esto va como carácter: Plus Jakarta Sans no trae ✓ (U+2713) ni ✕
 * (U+2715), así que el sistema los sustituye en silencio por otra fuente —
 * distinta en cada plataforma — o directamente no dibuja nada. Los trazos son
 * los del prototipo, copiados tal cual.
 *
 * Cada ícono trae su propio viewBox, el mismo con el que fue dibujado. El
 * `strokeWidth` se expresa en **píxeles ya renderizados** y se compensa contra
 * ese viewBox, así el trazo mide 2px a cualquier tamaño y todo el set se ve de
 * una sola familia.
 */

type Props = {
  size?: number;
  color: string;
  /** Grosor en píxeles renderizados, no en unidades del viewBox. */
  strokeWidth?: number;
};

const styles = StyleSheet.create({
  // Sin esto el contenedor lo achica en un solo eje y el trazo sale deformado:
  // dentro de una casilla con borde de 1.5px perdía 2px de alto.
  icon: { flexShrink: 0 },
});

function Icon({
  size,
  color,
  strokeWidth = 2,
  box,
  d,
}: Required<Pick<Props, 'size' | 'color'>> & Props & { box: number; d: string }) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${box} ${box}`} fill="none" style={styles.icon}>
      <Path
        d={d}
        stroke={color}
        strokeWidth={(strokeWidth * box) / size}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * El tilde. Único para las tres casillas y la fila de país.
 *
 * 12px es el tamaño del handoff: dentro de una casilla de 20–22px ocupa poco
 * más de la mitad. Llenarla lo hace ver tosco.
 */
export function Check({ size = 12, ...rest }: Props) {
  return <Icon size={size} box={12} d="M2.5 6.2 L4.8 8.5 L9.5 3.5" {...rest} />;
}

export function Cross({ size = 18, ...rest }: Props) {
  return <Icon size={size} box={18} d="M4 4 L14 14 M14 4 L4 14" {...rest} />;
}

export function ArrowLeft({ size = 17, ...rest }: Props) {
  return <Icon size={size} box={17} d="M11 3 L5 8.5 L11 14 M5 8.5 H14" {...rest} />;
}

export function ArrowRight({ size = 17, ...rest }: Props) {
  return <Icon size={size} box={17} d="M6 3 L12 8.5 L6 14 M12 8.5 H3" {...rest} />;
}

/** El "›" de las filas que abren otra pantalla. */
export function Chevron({ size = 16, ...rest }: Props) {
  return <Icon size={size} box={16} d="M6 3 L11 8 L6 13" {...rest} />;
}
