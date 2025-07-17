import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { uploadToAzure } from "../azure";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { summarizeTranscriptWithGrok } from "../openai";

export default function App() {
  const router = useRouter();
  const [file, setFile] = useState<any>(null);
  const opacity = useSharedValue(0);
  const overlay = useSharedValue(0);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const format = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = String(Math.floor(totalSec / 60)).padStart(2, "0");
    const s = String(totalSec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const pickAudio = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: "audio/*" });
    if (!res.canceled && res.assets.length) {
      const { uri, name = "audio", mimeType = "audio/*", size = 0 } = res.assets[0];
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
      const status = await sound.getStatusAsync();
      await sound.unloadAsync();
      setFile({ uri, name, mimeType, size, duration: status.durationMillis || 0 });
      opacity.value = withTiming(1, { duration: 500 });
    }
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      recordingRef.current = rec;
      await rec.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await rec.startAsync();
      recordingRef.current = rec;
      opacity.value = withTiming(0);
    } catch (e: any) {
      Alert.alert("Fout bij opname", e.message);
    }
  };

  const stopRecording = async () => {
    try {
      const rec = recordingRef.current;
      if (!rec) return;
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      setFile({ uri: uri!, name: "Opname.m4a", mimeType: "audio/m4a", size: 0, duration: rec.getStatusAsync().then(s => s.durationMillis || 0) });
      recordingRef.current = null;
      opacity.value = withTiming(1, { duration: 500 });
    } catch (e: any) {
      Alert.alert("Fout bij stoppen opname", e.message);
    }
  };

  const transcribe = async () => {
    if (!file) return;
    overlay.value = withTiming(1, { duration: 300 });
    try {
      const { transcript } = await uploadToAzure(file.uri, file.name, file.mimeType, p => console.log(`Upload: ${p.toFixed(0)}%`));
      const summary = await summarizeTranscriptWithGrok(transcript, "nl");
      router.push({ pathname: "/result", params: { transcript, summary: typeof summary === "string" ? summary : JSON.stringify(summary) } });
    } catch (e: any) {
      Alert.alert("Fout", e.message);
    } finally {
      overlay.value = withTiming(0, { duration: 300 });
    }
  };

  const testResult = () => {
    router.push({ pathname: "/result", params: { transcript: "Nep transcript.", summary: "Nep samenvatting." } });
  };

  return (
    <View className="flex-1 bg-white items-center pt-20 px-5">
      <Text className="text-4xl font-bold text-blue-600 mb-2">Luisterslim</Text>
      <Text className="text-base text-gray-600 mb-6 text-center">
        Upload audio of neem op
      </Text>
  
      <View className="flex-1 w-full justify-start items-center pt-16">
        {/* Record Knop iets boven de lijn */}
        <Pressable
          onPress={startRecording}
          className="flex-row items-center bg-blue-600 rounded-xl px-6 py-4 mb-4 shadow shadow-blue-200"
        >
          <Ionicons name="mic-outline" size={24} color="#fff" className="mr-2" />
          <Text className="text-base text-white font-semibold">Record</Text>
        </Pressable>
  
        {/* Centrale horizontale lijn hoger gepositioneerd */}
        <View className="w-full h-px bg-gray-300 my-4" />
  
        {/* Upload Knop iets onder de lijn */}
        <Pressable
          onPress={pickAudio}
          className="flex-row items-center bg-blue-600 rounded-xl px-6 py-4 mt-4 shadow shadow-blue-200"
        >
          <Ionicons name="document-attach-outline" size={24} color="#fff" className="mr-2" />
          <Text className="text-base text-white font-semibold">Upload</Text>
        </Pressable>
      </View>
  
      {/* Test Result knop */}
      <Pressable
        onPress={testResult}
        className="flex-row items-center bg-blue-100 rounded-xl px-6 py-3 mt-6 shadow shadow-blue-100"
      >
        <Ionicons name="play-circle-outline" size={20} color="#2563EB" className="mr-2" />
        <Text className="text-blue-600 font-semibold">Test Result</Text>
      </Pressable>
  
      {/* Bestand card */}
      {file && (
        <Animated.View style={animatedStyle} className="w-full bg-blue-50 rounded-xl p-5 items-center mb-6 shadow shadow-blue-100">
          <Text className="text-lg text-blue-800 mb-1">
            {file.name.length > 28 ? `${file.name.slice(0, 25)}…` : file.name}
          </Text>
          <Text className="text-sm text-blue-600 mb-3">
            {format(Number(file.duration))}{file.size ? ` • ${Math.round(file.size / 1024)} kB` : ""}
          </Text>
          <Pressable onPress={transcribe} className="bg-blue-600 rounded-full px-5 py-2">
            <Text className="text-white font-semibold">Transcribe</Text>
          </Pressable>
        </Animated.View>
      )}
  
      <LoadingOverlay visible={overlay} onCancel={() => (overlay.value = withTiming(0, { duration: 300 }))} />
    </View>
  );
  
}  