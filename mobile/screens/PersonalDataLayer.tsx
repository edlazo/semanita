import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Layer from '../components/Layer';
import { PrimaryButton } from '../components/Buttons';
import { fonts, Theme } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  name: string;
  email: string;
  onSave: (name: string) => Promise<void>;
  theme: Theme;
};

export default function PersonalDataLayer(props: Props) {
  const { theme } = props;
  const styles = getStyles(theme);

  const [name, setName] = useState(props.name);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (props.visible) {
      setName(props.name);
      setSaved(false);
    }
  }, [props.visible, props.name]);

  const changed = name.trim() !== props.name.trim();

  async function save() {
    setSaving(true);
    try {
      await props.onSave(name.trim());
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layer
      visible={props.visible}
      onClose={props.onClose}
      eyebrow="Tu cuenta"
      title="Datos personales"
      theme={theme}
      footer={
        <PrimaryButton
          title={saved && !changed ? 'Guardado' : 'Guardar cambios'}
          onPress={save}
          disabled={!changed}
          loading={saving}
          theme={theme}
        />
      }
    >
      <Text style={styles.label}>Nombre</Text>
      <TextInput
        style={styles.input}
        placeholder="Cómo querés que te llamemos"
        placeholderTextColor={theme.mut60}
        value={name}
        onChangeText={(v) => {
          setName(v);
          setSaved(false);
        }}
      />

      <Text style={[styles.label, styles.spaced]}>Email</Text>
      <Text style={styles.readonly}>{props.email}</Text>
      <Text style={styles.note}>Para cambiarlo escribinos: es la llave de tu cuenta.</Text>

      <Text style={[styles.label, styles.spaced]}>Contraseña</Text>
      <View style={styles.passRow}>
        <Text style={styles.readonly}>••••••••</Text>
        <Pressable hitSlop={16} onPress={props.onClose}>
          <Text style={styles.change}>Cambiar</Text>
        </Pressable>
      </View>
    </Layer>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    label: {
      fontFamily: fonts.bodySemi,
      fontSize: 15,
      letterSpacing: -0.15,
      color: theme.ink,
      marginBottom: 8,
    },
    spaced: { marginTop: 26 },
    input: {
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      fontFamily: fonts.body,
      fontSize: 15,
      color: theme.ink,
    },
    readonly: { fontFamily: fonts.body, fontSize: 15, color: theme.inkSoft, paddingVertical: 4 },
    note: {
      fontFamily: fonts.body,
      fontSize: 12.5,
      lineHeight: 19,
      color: theme.inkSoft,
      marginTop: 6,
    },
    passRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      minHeight: 44,
    },
    change: { fontFamily: fonts.bodySemi, fontSize: 13, color: theme.accent },
  });
}
