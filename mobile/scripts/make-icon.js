/**
 * Genera los íconos de la app: la S de Newsreader SemiBold, en crema sobre
 * cobre. La letra sale del mismo .ttf que usan los títulos de las pantallas,
 * así que el ícono y la app son literalmente la misma tipografía.
 *
 * Se corre a mano cuando hay que cambiar el ícono, no en cada build:
 *
 *   cd mobile
 *   npm i --no-save @resvg/resvg-js
 *   node scripts/make-icon.js
 *
 * Los PNG quedan versionados en `assets/`. El ícono es parte del build nativo:
 * cambiarlo exige un APK nuevo, no alcanza con recargar Metro.
 */
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const ROOT = path.join(__dirname, '..');
const FONT = path.join(ROOT, 'node_modules/@expo-google-fonts/newsreader/600SemiBold/Newsreader_600SemiBold.ttf');
const OUT = path.join(ROOT, 'assets');

// `accent` y `accentInk` del tema claro en theme.ts.
const COPPER = '#A9552C';
const CREAM = '#FBF3EC';
/** `accent` del tema oscuro: el cobre claro no tiene contraste sobre el fondo oscuro. */
const COPPER_DARK = '#D9834A';

function svg(size, { bg, fontSize, color }) {
  const back = bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : '';
  // El texto se ancla en la línea de base, no en el medio de la letra, así que
  // hay que bajarlo ~0.35 del cuerpo para centrarlo ópticamente.
  const y = size / 2 + fontSize * 0.35;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${back}
    <text x="${size / 2}" y="${y}" font-family="Newsreader" font-weight="600"
          font-size="${fontSize}" fill="${color}" text-anchor="middle">S</text>
  </svg>`;
}

function write(name, markup, size) {
  const png = new Resvg(markup, {
    fitTo: { mode: 'width', value: size },
    font: { fontFiles: [FONT], loadSystemFonts: false, defaultFontFamily: 'Newsreader' },
  })
    .render()
    .asPng();
  fs.writeFileSync(path.join(OUT, name), png);
  console.log(name, `${size}px`, `${(png.length / 1024).toFixed(0)}KB`);
}

// Cuadrado lleno: el recorte de esquinas lo pone cada plataforma.
write('icon.png', svg(1024, { bg: COPPER, fontSize: 780, color: CREAM }), 1024);

// Adaptativo de Android: son capas separadas que el sistema recorta y anima, y
// solo garantiza el 66% central. Por eso la letra va más chica y sin fondo.
write('android-icon-foreground.png', svg(1024, { bg: null, fontSize: 530, color: CREAM }), 1024);
write(
  'android-icon-background.png',
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="${COPPER}"/></svg>`,
  1024
);

// Monocromo (Material You): Android lo repinta con el color del sistema, así
// que acá solo importa la silueta.
write('android-icon-monochrome.png', svg(1024, { bg: null, fontSize: 530, color: '#000000' }), 1024);

write('favicon.png', svg(64, { bg: COPPER, fontSize: 49, color: CREAM }), 64);

// Pantalla de carga: acá el fondo lo pone la plataforma con el color del tema
// (`bg` claro / oscuro de theme.ts), así que va la letra sola en el acento que
// corresponde. Sin fondo propio no hay un cuadrado que no coincide con el tema.
write('splash-icon.png', svg(512, { bg: null, fontSize: 420, color: COPPER }), 512);
write('splash-icon-dark.png', svg(512, { bg: null, fontSize: 420, color: COPPER_DARK }), 512);
