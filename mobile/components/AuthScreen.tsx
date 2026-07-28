import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { PrimaryButton, SecondaryButton } from './Buttons';
import { radii, Theme, useAppTheme } from '../theme';

export default function AuthScreen() {
  const { theme, mode: themeMode, toggleMode: toggleThemeMode } = useAppTheme();
  const styles = getStyles(theme);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === 'signIn') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        setInfo('Cuenta creada. Si Supabase pide confirmación por email, revisá tu correo.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <SecondaryButton
          title={themeMode === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          onPress={toggleThemeMode}
          theme={theme}
        />
      </View>

      <Text style={styles.title}>{mode === 'signIn' ? 'Iniciar sesión' : 'Crear cuenta'}</Text>
      <View style={styles.rule} />

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={theme.inkSoft}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor={theme.inkSoft}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error && <Text style={styles.error}>{error}</Text>}
      {info && <Text style={styles.info}>{info}</Text>}

      <View style={styles.spacing}>
        <PrimaryButton
          title={loading ? 'Cargando...' : mode === 'signIn' ? 'Iniciar sesión' : 'Crear cuenta'}
          onPress={handleSubmit}
          disabled={loading || !email || !password}
          theme={theme}
        />
      </View>
      <SecondaryButton
        title={mode === 'signIn' ? '¿No tenés cuenta? Creá una' : '¿Ya tenés cuenta? Iniciá sesión'}
        onPress={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}
        theme={theme}
      />
    </View>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'stretch',
      paddingHorizontal: 28,
      gap: 12,
      backgroundColor: theme.bg,
    },
    topRow: {
      alignItems: 'center',
      marginBottom: 12,
    },
    title: {
      fontFamily: theme.fontDisplay,
      fontWeight: '400',
      fontSize: 24,
      color: theme.ink,
      textAlign: 'center',
    },
    rule: {
      width: 44,
      height: 1,
      alignSelf: 'center',
      backgroundColor: theme.accent,
      marginBottom: 16,
    },
    input: {
      alignSelf: 'stretch',
      fontFamily: theme.fontBody,
      color: theme.ink,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radii.btn,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    spacing: {
      marginTop: 8,
      alignSelf: 'stretch',
    },
    error: {
      color: theme.accent2,
      fontFamily: theme.fontBody,
    },
    info: {
      color: theme.accent,
      fontFamily: theme.fontBody,
    },
  });
}
