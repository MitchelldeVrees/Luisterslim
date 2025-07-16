import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, fontFamily } from './theme';

export default function App() {
  const [file, setFile] = React.useState<{ name: string; duration: number } | null>(null);
  const opacity = useSharedValue(0);

  const pickAudio = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
    if (result.type === 'success') {
      const { uri, name } = result;
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
      const status = await sound.getStatusAsync();
      const duration = status.isLoaded ? status.durationMillis ?? 0 : 0;
      await sound.unloadAsync();
      setFile({ name, duration });
      opacity.value = 0;
      opacity.value = withTiming(1, { duration: 500 });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const format = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Pressable style={styles.button} onPress={pickAudio}>
        <Text style={styles.buttonText}>Pick Audio</Text>
      </Pressable>
      {file && (
        <Animated.View style={[styles.card, animatedStyle]}>
          <Text style={styles.name}>{file.name}</Text>
          <Text style={styles.duration}>{format(file.duration)}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontFamily,
    fontSize: 16,
  },
  card: {
    marginTop: 20,
    padding: 20,
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  name: {
    fontFamily,
    fontSize: 16,
    marginBottom: 4,
  },
  duration: {
    fontFamily,
    color: colors.accent,
  },
});
