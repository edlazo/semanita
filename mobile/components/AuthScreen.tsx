import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { PrimaryButton } from './Buttons';
import { ScreenEntrance, Shake } from './Motion';
import { fonts, Mode, Theme } from '../theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = {
  theme: Theme;
  mode: Mode;
  toggleMode: () => void;
};

export default function AuthScreen({ theme, mode, toggleMode }: Props) {
  const styles = getStyles(theme);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signup, setSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit() {
    // Validar acá evita un viaje a Supabase para errores que ya conocemos.
    if (!EMAIL_RE.test(email)) {
      setError('Ese email no parece válido. Revisalo.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña necesita al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      if (signup) {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        setInfo('Cuenta creada. Si te pide confirmación por email, revisá tu correo.');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenEntrance style={styles.root} duration={400}>
      <View style={styles.header}>
        <Text style={styles.brand}>SEMANITA</Text>
        <Pressable onPress={toggleMode} hitSlop={10}>
          <Text style={styles.headerAction}>
            {mode === 'dark' ? 'MODO CLARO' : 'MODO OSCURO'}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.eyebrow}>DESDE 2026 · COCINA DE SEMANA</Text>

        <Text style={styles.title}>
          Comé bien{'\n'}toda la{'\n'}
          <Text style={styles.titleAccent}>semanita</Text>.
        </Text>

        <View style={styles.rule} />

        <Text style={styles.blurb}>
          {signup
            ? 'Creá tu cuenta y en dos minutos tenés la semana resuelta con lo que ya hay en casa.'
            : 'Sacale una foto a la heladera y te armamos la semana con lo que ya tenés.'}
        </Text>

        <View style={styles.fields}>
          <View>
            <Text style={styles.fieldLabel}>EMAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="rocio@correo.com"
              placeholderTextColor={theme.mut75}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                setError(null);
              }}
            />
          </View>
          <View>
            <Text style={styles.fieldLabel}>CONTRASEÑA</Text>
            <TextInput
              style={styles.input}
              placeholder="mínimo 6 caracteres"
              placeholderTextColor={theme.mut75}
              secureTextEntry
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                setError(null);
              }}
              onSubmitEditing={handleSubmit}
            />
          </View>
        </View>

        {error && (
          <Shake trigger={error}>
            <Text style={styles.error}>{error}</Text>
          </Shake>
        )}
        {info && <Text style={styles.info}>{info}</Text>}

        <View style={styles.ctaWrap}>
          <PrimaryButton
            title={signup ? 'CREAR CUENTA' : 'INICIAR SESIÓN'}
            onPress={handleSubmit}
            loading={loading}
            disabled={!email || !password}
            theme={theme}
          />
        </View>

        <Text style={styles.switchRow}>
          {signup ? '¿Ya tenés cuenta? ' : '¿No tenés cuenta? '}
          <Text
            style={styles.switchCta}
            onPress={() => {
              setSignup(!signup);
              setError(null);
              setInfo(null);
            }}
          >
            {signup ? 'Iniciá sesión' : 'Creá una'}
          </Text>
        </Text>

        <Text style={styles.footer}>EMPORIO DE COMIDA CASERA</Text>
      </ScrollView>
    </ScreenEntrance>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.bg,
      paddingTop: 52,
    },
    header: {
      flexShrink: 0,
      paddingHorizontal: 30,
      paddingBottom: 6,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    brand: {
      fontFamily: fonts.bodySemi,
      fontSize: 11,
      letterSpacing: 3.3,
      color: theme.ink,
    },
    headerAction: {
      fontFamily: fonts.bodyMedium,
      fontSize: 10,
      letterSpacing: 1.4,
      color: theme.accent,
    },
    // El bloque va dentro del scroll para que el pie siga alcanzable en pantallas cortas.
    body: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 30,
      paddingTop: 16,
      paddingBottom: 26,
    },
    eyebrow: {
      fontFamily: fonts.body,
      fontSize: 11,
      letterSpacing: 2.64,
      color: theme.accent,
      marginBottom: 14,
    },
    title: {
      fontFamily: fonts.display,
      fontSize: 38,
      lineHeight: 39,
      letterSpacing: -0.57,
      color: theme.ink,
    },
    titleAccent: {
      fontFamily: fonts.displayItalic,
      color: theme.accent,
    },
    rule: {
      height: 1,
      backgroundColor: theme.line26,
      marginTop: 20,
      marginBottom: 6,
    },
    blurb: {
      fontFamily: fonts.body,
      fontSize: 14,
      lineHeight: 22,
      color: theme.inkSoft,
      maxWidth: 320,
      marginBottom: 22,
    },
    fields: {
      gap: 13,
    },
    fieldLabel: {
      fontFamily: fonts.bodyMedium,
      fontSize: 9.5,
      letterSpacing: 1.9,
      color: theme.accent,
      marginBottom: 4,
    },
    input: {
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      fontFamily: fonts.body,
      fontSize: 15,
      color: theme.ink,
    },
    error: {
      marginTop: 12,
      fontFamily: fonts.body,
      fontSize: 13,
      lineHeight: 19,
      color: theme.accent,
    },
    info: {
      marginTop: 12,
      fontFamily: fonts.body,
      fontSize: 13,
      lineHeight: 19,
      color: theme.inkSoft,
    },
    ctaWrap: {
      marginTop: 22,
    },
    switchRow: {
      marginTop: 16,
      textAlign: 'center',
      fontFamily: fonts.body,
      fontSize: 14,
      color: theme.inkSoft,
    },
    switchCta: {
      color: theme.accent,
    },
    footer: {
      marginTop: 30,
      textAlign: 'center',
      fontFamily: fonts.body,
      fontSize: 10,
      letterSpacing: 1.6,
      color: theme.mut75,
    },
  });
}
