import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, View, Text, StyleSheet, Pressable, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { colors, fontFamily, rounded } from '../theme';

export default function Result() {
  const params = useLocalSearchParams<{ improved?: string; summary?: string }>();
  const improved = params.improved ?? '';
  const summary = params.summary ?? '';

  const copy = async (text: string) => {
    await Clipboard.setStringAsync(text);
  };

  const share = async (text: string) => {
    try {
      await Share.share({ message: text });
    } catch {}
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.heading}>Verbeterde Transcript</Text>
      <Text selectable style={styles.transcript}>{improved}</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Samenvatting</Text>
        <Text selectable style={styles.summary}>{summary}</Text>
        <View style={styles.actions}>
          <Pressable style={styles.button} onPress={() => copy(summary)}>
            <Text style={styles.buttonText}>Kopieer</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={() => share(summary)}>
            <Text style={styles.buttonText}>Deel</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heading: { fontFamily, fontSize: 24, color: '#000', marginBottom: 16 },
  transcript: { fontFamily, color: '#000', marginBottom: 24 },
  card: { backgroundColor: colors.accent, padding: 20, borderRadius: rounded },
  cardTitle: { fontFamily, fontSize: 18, marginBottom: 8 },
  summary: { fontFamily, color: '#000', marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 10 },
  button: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: rounded },
  buttonText: { color: '#fff', fontFamily },
});
