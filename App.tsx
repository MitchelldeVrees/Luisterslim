import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { uploadToAzure } from './azure';
import { LoadingOverlay } from './components/LoadingOverlay';
import { colors, fontFamily, rounded } from './theme';

export default function App() {
  const [file, setFile] = React.useState<
    | {
        uri: string;
        name: string;
        mimeType: string;
        size: number;
        duration: number;
      }
    | null
  >(null);
  const [transcript, setTranscript] = React.useState<string | null>(null);
  const opacity = useSharedValue(0);
  const overlay = useSharedValue(0);

  const pickAudio = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
    if (!result.canceled && result.assets && result.assets.length) {
      const asset = result.assets[0];
      const { uri, name = 'audio', mimeType = 'audio/*', size = 0 } = asset;
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
      const status = await sound.getStatusAsync();
      const duration = status.isLoaded ? status.durationMillis ?? 0 : 0;
      await sound.unloadAsync();
      setFile({ uri, name, mimeType, size, duration });
      setTranscript(null);
      opacity.value = 0;
      opacity.value = withTiming(1, { duration: 500 });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const truncate = (name: string) => (name.length > 28 ? `${name.slice(0, 25)}...` : name);

  const format = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const transcribe = async () => {
    if (!file) return;
    overlay.value = withTiming(1, { duration: 300 });

    try {
      const { transcript } = await uploadToAzure(
        file.uri,
        file.name,
        file.mimeType,
        (p) => console.log(`Upload progress: ${p.toFixed(0)}%`)
      );
      console.log('Transcript from Azure:', transcript);
      setTranscript(transcript);
    } catch (e: any) {
      console.error(e);
    } finally {
      overlay.value = withTiming(0, { duration: 300 });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Pressable style={styles.button} onPress={pickAudio}>
        <Text style={styles.buttonText}>Pick Audio</Text>
      </Pressable>
      {file && (
        <Animated.View style={[styles.card, animatedStyle]}>
          <Text style={styles.name}>{truncate(file.name)}</Text>
          <Text style={styles.meta}>
            {format(file.duration)} • {Math.round(file.size / 1024)} kB
          </Text>
          <Pressable style={styles.transcribeButton} onPress={transcribe}>
            <Text style={styles.transcribeText}>Notuleren</Text>
          </Pressable>
        </Animated.View>
      )}
      {transcript && (
        <View style={styles.transcriptBox}>
          <Text style={styles.transcript}>{transcript}</Text>
        </View>
      )}
      <LoadingOverlay visible={overlay} onCancel={() => (overlay.value = withTiming(0, { duration: 300 }))} />
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
    borderRadius: rounded,
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
    borderRadius: rounded,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  name: {
    fontFamily,
    fontSize: 16,
    marginBottom: 4,
  },
  meta: {
    fontFamily,
    color: colors.accent,
    marginBottom: 12,
  },
  transcribeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: rounded,
  },
  transcribeText: {
    color: '#fff',
    fontFamily,
  },
  transcriptBox: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: rounded,
    width: '100%',
  },
  transcript: {
    fontFamily,
  },
});
