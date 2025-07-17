// app/result.tsx

import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView, Share, Text, View } from 'react-native';

export default function Result() {
  const { transcript = '', summary = '' } = useLocalSearchParams<{
    transcript?: string;
    summary?: string;
  }>();

  const copy = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('Gekopieerd!');
    } catch {
      Alert.alert('Fout bij kopiëren');
    }
  };

  const share = async (text: string) => {
    try {
      await Share.share({ message: text });
    } catch {}
  };

  return (
    <ScrollView
      className="flex-1 bg-bg px-5 pt-6"
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      {/* Transcript Section */}
      <Text className="text-2xl font-bold text-text mb-4">
        Transcript
      </Text>                                                  

      <Text
        selectable
        className="text-text mb-8"
      >
        {transcript}
      </Text>

      {/* Summary Card */}
      <View className="bg-accent rounded-lg p-6 shadow-md mb-6">
        <Text className="text-xl font-semibold text-text mb-3">
          Samenvatting
        </Text>                                  

        <Text
          selectable
          className="text-text mb-4"
        >
          {summary}
        </Text>

        {/* Action Buttons */}
        <View className="flex-row space-x-3">
          <Pressable
            onPress={() => copy(summary)}
            className="flex-1 bg-primary py-3 rounded-lg items-center"
          >
            <Text className="text-white font-medium">
              Kopieer
            </Text>
          </Pressable>
          <Pressable
            onPress={() => share(summary)}
            className="flex-1 border border-primary py-3 rounded-lg items-center"
          >
            <Text className="text-primary font-medium">
              Deel
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
