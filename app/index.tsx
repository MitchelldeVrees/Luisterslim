import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { uploadToAzure } from '../azure';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { summarizeTranscriptWithGrok } from '../openai';
import { colors, fontFamily, rounded } from '../theme';

export default function App() {

  const router = useRouter();
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

      const detectedLang = 'nl';
      const summary = await summarizeTranscriptWithGrok(transcript, detectedLang);
      router.push({
        pathname: '/result',
        params: {
          transcript,
          summary: typeof summary === 'string'
            ? summary
            : JSON.stringify(summary),
        },
      });
    } catch (e: any) {
      Alert.alert('Fout', e.message);
    } finally {
      overlay.value = withTiming(0, { duration: 300 });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={styles.title}>Luisterslim</Text>
      <Text style={styles.subtitle}>Kies een geluidsbestand om te transcriberen</Text>
      <Pressable style={styles.button} onPress={pickAudio}>
        <Ionicons name="document-attach-outline" size={20} color="#fff" />
        <Text style={styles.buttonText}>Kies audio</Text>
      </Pressable>
      {file && (
        <Animated.View style={[styles.card, animatedStyle]}>
          <Text style={styles.name}>{truncate(file.name)}</Text>
          <Text style={styles.meta}>
            {format(file.duration)} • {Math.round(file.size / 1024)} kB
          </Text>
          <Pressable style={styles.transcribeButton} onPress={transcribe}>
            <Text style={styles.transcribeText}>Transcribe</Text>
          </Pressable>
        </Animated.View>
      )}
      <LoadingOverlay
        visible={overlay}
        onCancel={() => (overlay.value = withTiming(0, { duration: 300 }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20,
    paddingTop: 80,
  },
  title: {
    fontFamily,
    color: colors.text,
    fontSize: 32,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily,
    color: colors.text,
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  name: {
    fontFamily,
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  meta: {
    fontFamily,
    color: colors.text,
    marginBottom: 12,
  },
  transcribeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: rounded,
    marginTop: 10,
  },
  transcribeText: {
    color: '#fff',
    fontFamily,
  },
});
