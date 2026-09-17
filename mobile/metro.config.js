// La config por defecto de Expo, más lo que Sentry necesita: le pone a cada
// bundle un ID que también queda en su source map, y así un error del APK se
// puede traducir a archivo y línea del código original.
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);
