import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { uploadToAzure } from '../azure';
import { summarizeTranscriptWithGrok } from '../openai';
import { colors, fontFamily, rounded } from '../theme';
import type { AudioStudioRecorder } from '@siteed/expo-audio-studio';

export default function RecordScreen() {
  const router = useRouter();
  const [recording, setRecording] = React.useState<Audio.Recording | null>(null);
  const [paused, setPaused] = React.useState(false);
  const [duration, setDuration] = React.useState(0);
  const [quality, setQuality] = React.useState('');
  const interval = React.useRef<NodeJS.Timer | null>(null);
  const studio = React.useRef<AudioStudioRecorder | null>(null);

  const move = useSharedValue(0);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: move.value },
      { scale: scale.value },
    ],
  }));

  const format = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startRecording = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) return;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        android: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
          isMeteringEnabled: true,
        },
        ios: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
          isMeteringEnabled: true,
        },
      } as any);
      await rec.startAsync();
      setRecording(rec);
      setPaused(false);
      setQuality('');
      try {
        const { Recorder } = require('@siteed/expo-audio-studio');
        studio.current = new Recorder();
        await studio.current.startAsync();
      } catch {}
      move.value = withTiming(200, { duration: 500 });
      scale.value = withTiming(0.6, { duration: 500 });
      setDuration(0);
      interval.current = setInterval(async () => {
        const status = await rec.getStatusAsync();
        if (status.isRecording || status.isPaused) {
          setDuration(status.durationMillis ?? 0);
          if (typeof status.metering === 'number') {
            const m = status.metering as number;
            setQuality(m > -20 ? 'Goed' : m > -40 ? 'Redelijk' : 'Slecht');
          } else if (studio.current?.getRMS) {
            const rms = await studio.current.getRMS();
            setQuality(rms > 0.1 ? 'Goed' : rms > 0.05 ? 'Redelijk' : 'Slecht');
          }
        }
      }, 100);
    } catch (e) {
      console.error('Failed to start recording', e);
    }
  };

  const pauseRecording = async () => {
    if (!recording) return;
    try {
      await recording.pauseAsync();
      if (studio.current?.pauseAsync) await studio.current.pauseAsync();
    } catch (e) {
      console.error('Failed to pause', e);
    }
    setPaused(true);
  };

  const resumeRecording = async () => {
    if (!recording) return;
    try {
      await recording.startAsync();
      if (studio.current?.startAsync) await studio.current.startAsync();
    } catch (e) {
      console.error('Failed to resume', e);
    }
    setPaused(false);
  };

  const stopRecording = async () => {
    if (!recording) return null;
    try {
      await recording.stopAndUnloadAsync();
      if (studio.current?.stopAndUnloadAsync) await studio.current.stopAndUnloadAsync();
    } catch (e) {
      console.error('Failed to stop recording', e);
    }
    const uri = recording.getURI() || null;
    setRecording(null);
    move.value = withTiming(0, { duration: 500 });
    scale.value = withTiming(1, { duration: 500 });
    if (interval.current) {
      clearInterval(interval.current);
      interval.current = null;
    }
    return uri;
  };

  const togglePause = () => {
    if (paused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  };

  const downloadRecording = async () => {
    const uri = await stopRecording();
    if (!uri) return;
    try {
      await Share.share({ url: uri });
    } catch (e) {
      Alert.alert('Fout bij delen');
    }
  };

  const transcribeRecording = async () => {
    const uri = await stopRecording();
    if (!uri) return;
    try {
      const { transcript } = await uploadToAzure(uri, 'recording.m4a', 'audio/m4a');
      const summary = await summarizeTranscriptWithGrok(transcript, 'nl');
      router.push({
        pathname: '/result',
        params: {
          transcript,
          summary: typeof summary === 'string' ? summary : JSON.stringify(summary),
        },
      });
    } catch (e: any) {
      Alert.alert('Fout', e.message);
    }
  };

  React.useEffect(() => {
    return () => {
      if (interval.current) clearInterval(interval.current);
      if (recording) recording.stopAndUnloadAsync().catch(() => {});
      if (studio.current?.stopAndUnloadAsync) studio.current.stopAndUnloadAsync().catch(() => {});
    };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Pressable style={styles.back} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={colors.text} />
      </Pressable>
      {recording && (
        <Text style={styles.timer}>{format(duration)}</Text>
      )}
      {quality ? (
        <Text style={styles.quality}>{`Kwaliteit: ${quality}`}</Text>
      ) : null}
      <Animated.View style={[animatedStyle]}>
        <Pressable
          style={styles.button}
          onPress={recording ? togglePause : startRecording}
        >
          <Ionicons
            name={recording ? (paused ? 'pause' : 'stop') : 'mic'}
            size={48}
            color="#fff"
          />
        </Pressable>
      </Animated.View>
      {paused && (
        <View style={styles.actions}>
          <Pressable style={styles.sideButton} onPress={downloadRecording}>
            <Ionicons name="download" size={24} color="#fff" />
          </Pressable>
          <Pressable style={styles.sideButton} onPress={transcribeRecording}>
            <Text style={styles.transcribeText}>Transcribe</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: colors.record,
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: {
    position: 'absolute',
    top: 40,
    left: 20,
  },
  timer: {
    position: 'absolute',
    top: 80,
    fontFamily,
    fontSize: 32,
    color: colors.text,
  },
  quality: {
    position: 'absolute',
    top: 120,
    fontFamily,
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 20,
  },
  sideButton: {
    backgroundColor: colors.record,
    padding: 12,
    borderRadius: rounded,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transcribeText: {
    color: '#fff',
    fontFamily,
  },
});
