import { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function AuthScreen() {
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
      <Text style={styles.title}>{mode === 'signIn' ? 'Iniciar sesión' : 'Crear cuenta'}</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error && <Text style={styles.error}>{error}</Text>}
      {info && <Text style={styles.info}>{info}</Text>}

      <Button
        title={loading ? 'Cargando...' : mode === 'signIn' ? 'Iniciar sesión' : 'Crear cuenta'}
        onPress={handleSubmit}
        disabled={loading || !email || !password}
      />
      <Button
        title={mode === 'signIn' ? '¿No tenés cuenta? Creá una' : '¿Ya tenés cuenta? Iniciá sesión'}
        onPress={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  error: {
    color: 'red',
  },
  info: {
    color: '#2a7',
  },
});
