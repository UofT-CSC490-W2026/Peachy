import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useInterests } from '@/hooks/use-interests';
import { INTEREST_CATEGORIES } from '@/constants/interests';

export default function InterestsScreen() {
  const router = useRouter();
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  const surfaceColor = useThemeColor({}, 'surface');
  const tintColor = useThemeColor({}, 'tint');
  const { selected, toggle } = useInterests();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={22} color={textColor} />
        </Pressable>
        <ThemedText style={styles.title}>Interests</ThemedText>
        <View style={styles.topBarSpacer} />
      </View>

      <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
        Select what you're into — others with the same interests can find you.
      </ThemedText>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {INTEREST_CATEGORIES.map((category) => (
          <View key={category.id} style={styles.category}>
            <ThemedText style={[styles.categoryHeader, { color: textSecondary }]}>
              {category.label.toUpperCase()}
            </ThemedText>
            <View style={styles.tagsWrap}>
              {category.tags.map((tag) => {
                const isSelected = selected.has(tag.id);
                return (
                  <Pressable
                    key={tag.id}
                    style={[
                      styles.tag,
                      isSelected
                        ? { backgroundColor: tintColor, borderColor: tintColor }
                        : { backgroundColor: surfaceColor, borderColor },
                    ]}
                    onPress={() => toggle(tag.id)}
                  >
                    <ThemedText
                      style={[
                        styles.tagLabel,
                        { color: isSelected ? '#fff' : textColor },
                      ]}
                    >
                      {tag.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 8,
  },
  backButton: { width: 40, alignItems: 'flex-start', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '700' },
  topBarSpacer: { width: 40 },
  subtitle: {
    fontSize: 14,
    paddingHorizontal: 20,
    marginBottom: 20,
    lineHeight: 20,
  },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 48 },
  category: { marginBottom: 28 },
  categoryHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagLabel: { fontSize: 14, fontWeight: '600' },
});
