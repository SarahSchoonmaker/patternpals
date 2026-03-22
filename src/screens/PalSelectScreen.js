// src/screens/PalSelectScreen.js
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { PALS } from "../data/gameData";
import { loadSave, patchSave } from "../hooks/useStorage";
import { colors, fonts, radius, shadows, spacing } from "../utils/theme";
import { BackButton } from "../components/UI";

export default function PalSelectScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [save, setSave] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadSave().then(setSave);
    }, []),
  );

  async function selectPal(palId) {
    const updated = await patchSave({ selPal: palId });
    setSave(updated);
  }

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
            <Text style={styles.title}>🎭 My Pals</Text>
            <View style={{ width: 44 }} />
          </View>
          <Text style={styles.sub}>
            Earn XP to unlock new pals! Total: {save.totalXP} XP
          </Text>
          <View style={styles.grid}>
            {PALS.map((p) => {
              const unlocked = save.totalXP >= p.xpReq;
              const selected = save.selPal === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.palCard,
                    selected && styles.palCardSel,
                    !unlocked && styles.palCardLocked,
                  ]}
                  onPress={() => unlocked && selectPal(p.id)}
                  activeOpacity={unlocked ? 0.8 : 1}
                >
                  <Text style={styles.palEmoji}>{p.emoji}</Text>
                  <Text style={styles.palName}>{p.name}</Text>
                  <Text style={styles.palReq}>
                    {unlocked
                      ? selected
                        ? "✓ Active"
                        : "Unlocked!"
                      : `${p.xpReq} XP`}
                  </Text>
                  {!unlocked && <Text style={styles.lock}>🔒</Text>}
                  {selected && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingTop: spacing.md, paddingBottom: 40 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  title: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.dark },
  sub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.dim,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  palCard: {
    width: "30%",
    flexGrow: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 14,
    alignItems: "center",
    ...shadows.sm,
    borderWidth: 3,
    borderColor: "transparent",
    position: "relative",
  },
  palCardSel: { borderColor: colors.blue },
  palCardLocked: { opacity: 0.45 },
  palEmoji: { fontSize: 42, marginBottom: 6 },
  palName: { fontFamily: fonts.display, fontSize: 13, color: colors.dark },
  palReq: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.dim,
    marginTop: 3,
  },
  lock: { position: "absolute", top: 7, right: 9, fontSize: 14 },
  checkmark: {
    position: "absolute",
    top: 7,
    right: 9,
    fontSize: 14,
    color: colors.blue,
    fontFamily: fonts.display,
  },
});
