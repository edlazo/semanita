import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Checkbox from '../components/Checkbox';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import { CtaBar, Eyebrow, Header } from '../components/Chrome';
import { ScreenEntrance } from '../components/Motion';
import { itemKey, ShoppingCategory } from '../lib/shopping';
import { fonts, radii, Theme } from '../theme';

export type { ShoppingCategory };

/** El diseño fija este orden; las categorías que no vengan simplemente no se muestran. */
const CATEGORY_ORDER = ['Verdulería', 'Almacén', 'Carnicería'];

function orderCategories(categories: ShoppingCategory[]): ShoppingCategory[] {
  return [...categories].sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a.category);
    const ib = CATEGORY_ORDER.indexOf(b.category);
    // Las categorías fuera de la lista van al final, en el orden que vinieron.
    return (ia === -1 ? CATEGORY_ORDER.length : ia) - (ib === -1 ? CATEGORY_ORDER.length : ib);
  });
}

type Props = {
  theme: Theme;
  onOpenProfile: () => void;
  profileName: string;
  profileEmail: string;

  categories: ShoppingCategory[];
  checked: Set<string>;
  onToggleItem: (key: string) => void;
  onBackToMenu: () => void;
};

export default function ShoppingScreen(props: Props) {
  const { theme } = props;
  const styles = getStyles(theme);

  const ordered = orderCategories(props.categories.filter((c) => c.items.length > 0));
  const total = ordered.reduce((sum, c) => sum + c.items.length, 0);
  // Contar sobre lo visible: `checked` puede conservar ítems de comidas que se
  // destildaron, y esos ya no cuentan para el progreso.
  const done = ordered.reduce(
    (sum, c) => sum + c.items.filter((i) => props.checked.has(itemKey(c.category, i))).length,
    0
  );
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const allDone = total > 0 && done >= total;

  return (
    <ScreenEntrance style={styles.root}>
      <View style={styles.top}>
        <Header
          theme={theme}
          onOpenProfile={props.onOpenProfile}
          profileName={props.profileName}
          profileEmail={props.profileEmail}
        />

        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Lo que falta</Text>
            <Text style={styles.subtitle}>
              {total > 0 ? 'Tocá cada uno cuando lo tengas' : 'Sin comidas elegidas todavía'}
            </Text>
          </View>
          {/* Sin lista, un "0 de 0" promete un progreso que no existe. */}
          <Text style={styles.counter}>{total > 0 ? `${done} de ${total}` : '—'}</Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollBody}>
        {ordered.length === 0 && (
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyTitle}>Todavía no hay lista</Text>
            <Text style={styles.emptyBody}>
              Armá el menú de la semana y acá te juntamos lo que falta comprar.
            </Text>
          </View>
        )}

        {ordered.map((cat) => (
          <View key={cat.category} style={styles.categoryBlock}>
            <Eyebrow theme={theme} rule="accent" meta={String(cat.items.length)}>
              {cat.category}
            </Eyebrow>
            {cat.items.map((item) => {
              const key = itemKey(cat.category, item);
              const isChecked = props.checked.has(key);
              return (
                <Pressable
                  key={key}
                  onPress={() => props.onToggleItem(key)}
                  style={styles.itemRow}
                >
                  <Checkbox checked={isChecked} size={20} shape="shopping" theme={theme} />
                  <Text style={[styles.itemText, isChecked && styles.itemTextDone]}>{item}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}

        {allDone && (
          <View style={styles.doneBlock}>
            <Text style={styles.doneTitle}>Listo, ya está todo</Text>
            <Text style={styles.doneBody}>Andá a cocinar. Volvé al menú para ver las recetas.</Text>
          </View>
        )}
      </ScrollView>

      <CtaBar theme={theme}>
        {allDone ? (
          // Con todo comprado, volver al menú deja de ser una salida y pasa a ser
          // el próximo paso: ahí están las comidas listas y sus recetas.
          <PrimaryButton title="Volver al menú" onPress={props.onBackToMenu} theme={theme} />
        ) : (
          <SecondaryButton title="Volver al menú" onPress={props.onBackToMenu} fullWidth theme={theme} />
        )}
      </CtaBar>
    </ScreenEntrance>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg, paddingTop: 52 },
    top: { paddingHorizontal: 26 },
    scroll: { flex: 1 },
    scrollBody: { paddingHorizontal: 26, paddingTop: 14, paddingBottom: 104 },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      // Compras no tiene indicador de pasos: este filete es el que separa el
      // header del contenido, como en las otras pantallas.
      borderTopWidth: 1,
      borderTopColor: theme.line26,
      paddingTop: 14,
      marginBottom: 12,
      gap: 12,
    },
    titleBlock: { flexShrink: 1 },
    title: {
      fontFamily: fonts.displaySemi,
      fontSize: 30,
      lineHeight: 32,
      letterSpacing: -0.45,
      color: theme.ink,
    },
    subtitle: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: theme.inkSoft,
      marginTop: 3,
    },
    counter: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13.5,
      color: theme.accent,
    },
    progressTrack: {
      height: 2,
      backgroundColor: theme.line20,
      marginBottom: 4,
    },
    progressFill: {
      height: 2,
      backgroundColor: theme.accent,
    },
    categoryBlock: { marginBottom: 20 },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderBottomColor: theme.line14,
    },
    itemText: {
      fontFamily: fonts.body,
      fontSize: 15,
      color: theme.ink,
      flexShrink: 1,
    },
    itemTextDone: {
      color: theme.inkSoft,
      textDecorationLine: 'line-through',
    },
    emptyBlock: {
      padding: 16,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: theme.border,
      borderRadius: radii.empty,
    },
    emptyTitle: {
      fontFamily: fonts.displaySemi,
      fontSize: 19,
      lineHeight: 24,
      color: theme.ink,
      marginBottom: 5,
    },
    emptyBody: {
      fontFamily: fonts.body,
      fontSize: 13.5,
      lineHeight: 20,
      color: theme.inkSoft,
    },
    // Relleno de acento, no bordeado: terminar la lista es la buena noticia
    // de la pantalla y se cobra el único bloque pleno que hay acá.
    doneBlock: {
      padding: 18,
      borderRadius: radii.membership,
      backgroundColor: theme.accent,
      marginBottom: 20,
    },
    doneTitle: {
      fontFamily: fonts.displaySemi,
      fontSize: 22,
      lineHeight: 25,
      color: theme.accentInk,
      marginBottom: 6,
    },
    doneBody: {
      fontFamily: fonts.body,
      fontSize: 13.5,
      lineHeight: 20,
      color: theme.accentInk,
    },
  });
}
