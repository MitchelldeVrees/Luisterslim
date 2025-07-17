import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, rounded } from '../theme';

export default function RecordScreen() {
  const router = useRouter();
  const [recording, setRecording] = React.useState<Audio.Recording | null>(null);
  const [duration, setDuration] = React.useState(0);
  const interval = React.useRef<NodeJS.Timer | null>(null);

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
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      setRecording(rec);
      move.value = withTiming(200, { duration: 500 });
      scale.value = withTiming(0.6, { duration: 500 });
      setDuration(0);
      interval.current = setInterval(async () => {
        const status = await rec.getStatusAsync();
        if (status.isRecording) setDuration(status.durationMillis ?? 0);
      }, 100);
    } catch (e) {
      console.error('Failed to start recording', e);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
    } catch (e) {
      console.error('Failed to stop recording', e);
    }
    setRecording(null);
    move.value = withTiming(0, { duration: 500 });
    scale.value = withTiming(1, { duration: 500 });
    if (interval.current) {
      clearInterval(interval.current);
      interval.current = null;
    }
  };

  const toggleRecording = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  React.useEffect(() => {
    return () => {
      if (interval.current) clearInterval(interval.current);
      if (recording) recording.stopAndUnloadAsync().catch(() => {});
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
      <Animated.View style={[animatedStyle]}>
        <Pressable style={styles.button} onPress={toggleRecording}>
          <Ionicons name={recording ? 'stop' : 'mic'} size={48} color="#fff" />
        </Pressable>
      </Animated.View>
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
});
