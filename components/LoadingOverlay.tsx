import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, rounded } from '../theme';

interface Props {
  visible: Animated.SharedValue<number>;
  onCancel?: () => void;
}

export function LoadingOverlay({ visible, onCancel }: Props) {
  const style = useAnimatedStyle(() => ({
    opacity: visible.value,
    pointerEvents: visible.value > 0 ? 'auto' : 'none',
  }));

  return (
    <Animated.View style={[styles.overlay, style]}>
      <View style={styles.box}>
        <Pressable style={styles.close} onPress={onCancel}>
          <Ionicons name="close" size={24} color={colors.primary} />
        </Pressable>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.text}>We’re transcribing…</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  box: {
    backgroundColor: colors.bg,
    padding: 24,
    borderRadius: rounded,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 220,
  },
  text: {
    marginTop: 12,
    fontFamily,
    color: '#000',
  },
  close: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
});
