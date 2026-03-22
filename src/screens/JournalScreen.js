// src/screens/JournalScreen.js
import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { EMOTIONS } from "../data/gameData";
import { loadSave } from "../hooks/useStorage";
import { colors, fonts, radius, shadows, spacing } from "../utils/theme";
import { BackButton } from "../components/UI";

export default function JournalScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [save, setSave] = useState(null);
  useFocusEffect(
    useCallback(() => {
      loadSave().then(setSave);
    }, []),
  );
  if (!save) return null;

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#c9e8ff", "#e8f4fd", "#d4f0e0"]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }} edges={["left", "right", "bottom"]}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 12 },
          ]}
        >
          <View style={styles.topBar}>
            <BackButton onPress={() => navigation.goBack()} />
            <Text style={styles.title}>📖 Emotion Journal</Text>
            <View style={{ width: 44 }} />
          </View>
          <Text style={styles.sub}>
            Every emotion you echo gets saved here!
          </Text>

          <View style={styles.grid}>
            {EMOTIONS.map((e) => {
              const cnt = save.emoCounts?.[e.id] || 0;
              return (
                <View
                  key={e.id}
                  style={[styles.card, { borderLeftColor: e.color }]}
                >
                  <Text style={styles.emo}>{e.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.emoName}>{e.label}</Text>
                    <Text style={styles.emoDesc}>{e.desc}</Text>
                    <Text style={[styles.emoCount, { color: e.color }]}>
                      {cnt > 0
                        ? `Felt ${cnt} time${cnt > 1 ? "s" : ""} ✓`
                        : "Not yet explored"}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Progress */}
          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>
              {Object.keys(save.emoCounts || {}).length} / 8 Emotions Explored
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${(Object.keys(save.emoCounts || {}).length / 8) * 100}%`,
                  },
                ]}
              />
            </View>
            {Object.keys(save.emoCounts || {}).length >= 8 && (
              <Text style={styles.allDone}>
                🌈 Emotion Expert! All 8 emotions explored!
              </Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingTop: spacing.md, paddingBottom: 50 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  title: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.dark },
  sub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.dim,
    textAlign: "center",
    marginBottom: spacing.lg,
  },

  grid: { gap: 12, marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    borderLeftWidth: 4,
    ...shadows.sm,
  },
  emo: { fontSize: 36 },
  emoName: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.dark,
    marginBottom: 2,
  },
  emoDesc: {
    fontFamily: fonts.bodyReg,
    fontSize: 11,
    color: colors.dim,
    lineHeight: 16,
    marginBottom: 4,
  },
  emoCount: { fontFamily: fonts.body, fontSize: 11 },

  progressCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },
  progressTitle: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.dark,
    marginBottom: 10,
  },
  progressTrack: {
    height: 12,
    backgroundColor: "#eee",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill: { height: 12, backgroundColor: colors.green, borderRadius: 8 },
  allDone: {
    fontFamily: fonts.display,
    fontSize: 14,
    color: colors.green,
    textAlign: "center",
  },
});
