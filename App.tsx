import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const colors = {
  primary: '#3FB0AC',
  accent: '#FFC857',
  background: '#FFF9F4',
};

type FileInfo = {
  name: string;
  duration: number;
};

export default function App() {
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const scale = useSharedValue(1);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(20);

  const [fontsLoaded] = useFonts({
    'Poppins-Medium': require('./assets/fonts/Poppins-Medium.ttf'),
  });

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  useEffect(() => {
    if (fileInfo) {
      cardOpacity.value = 0;
      cardTranslateY.value = 20;
      cardOpacity.value = withTiming(1, { duration: 300 });
      cardTranslateY.value = withTiming(0, { duration: 300 });
    }
  }, [fileInfo, cardOpacity, cardTranslateY]);

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.round(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const truncate = (text: string, max: number) => {
    if (text.length <= max) return text;
    const keep = Math.floor(max / 2) - 1;
    return `${text.slice(0, keep)}…${text.slice(text.length - keep)}`;
  };

  const handleSelectAudio = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
      if (result.canceled || !result.assets.length) {
        return;
      }
      const asset = result.assets[0];
      const sound = new Audio.Sound();
      await sound.loadAsync({ uri: asset.uri });
      const status = await sound.getStatusAsync();
      await sound.unloadAsync();
      if (!status.isLoaded) return;
      setFileInfo({ name: asset.name ?? 'audio', duration: status.durationMillis ?? 0 });
    } catch (e) {
      Alert.alert('Permission error', 'Unable to access files.');
    }
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Ionicons name="headset" size={64} color={colors.primary} style={styles.logo} />
      <Text style={styles.title}>LuisterSlim</Text>
      <Animated.View style={[animatedButtonStyle]}>
        <Pressable
          style={styles.button}
          onPress={handleSelectAudio}
          onPressIn={() => (scale.value = withTiming(0.95, { duration: 120 }))}
          onPressOut={() => (scale.value = withTiming(1, { duration: 120 }))}
        >
          <Ionicons name="cloud-upload" size={24} color="#000" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Select audio</Text>
        </Pressable>
      </Animated.View>
      {fileInfo && (
        <Animated.View style={[styles.card, animatedCardStyle]}>
          <Ionicons name="musical-note" size={24} color={colors.primary} style={styles.cardIcon} />
          <Text style={styles.fileName}>{truncate(fileInfo.name, 28)}</Text>
          <Text style={styles.duration}>{formatDuration(fileInfo.duration)}</Text>
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
    padding: 24,
    backgroundColor: colors.background,
  },
  logo: {
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Poppins-Medium',
    color: colors.primary,
    marginBottom: 24,
  },
  button: {
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 8,
    width: '100%',
    maxWidth: 340,
  },
  cardIcon: {
    marginRight: 8,
  },
  fileName: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    color: '#000',
  },
  duration: {
    fontFamily: 'Poppins-Medium',
    color: '#000',
  },
});
