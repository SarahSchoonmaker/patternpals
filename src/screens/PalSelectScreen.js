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

  async function selectPal(pal) {
    // If pal needs premium and user doesn't have it — show paywall
    if (pal.premium && !save.isPremium) {
      navigation.navigate("Paywall", { triggerPal: pal });
      return;
    }
    // If pal needs XP and user doesn't have enough
    if (save.totalXP < pal.xpReq) {
      // Can't select yet — show XP needed
      return;
    }
    const updated = await patchSave({ selPal: pal.id });
    setSave(updated);
  }

  if (!save) return null;

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#0f1f43", "#1f3a6f", "#0b1a2f"]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }} edges={["left", "right", "bottom"]}>
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingTop: insets.top + 12 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.topBar}>
            <BackButton onPress={() => navigation.goBack()} />
            <Text style={s.title}>🎭 My Pals</Text>
            <View style={{ width: 44 }} />
          </View>

          <Text style={s.sub}>
            {save.isPremium
              ? `All pals unlocked! Total XP: ${save.totalXP}`
              : `Unlock all 9 pals for $7.99 · Total XP: ${save.totalXP}`}
          </Text>

          {/* Premium banner if not purchased */}
          {!save.isPremium && (
            <TouchableOpacity
              style={s.premiumBanner}
              onPress={() => navigation.navigate("Paywall", {})}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={["#FFD93D", "#FF9A3C"]}
                style={s.premiumGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={s.premiumBannerIcon}>👑</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.premiumBannerTitle}>
                    Unlock All 9 Pals — $7.99
                  </Text>
                  <Text style={s.premiumBannerSub}>
                    One-time · No subscription · Family Sharing
                  </Text>
                </View>
                <Text style={s.premiumArrow}>›</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <View style={s.grid}>
            {PALS.map((pal) => {
              const hasXP = save.totalXP >= pal.xpReq;
              const hasPremium = !pal.premium || save.isPremium;
              const isSelectable = hasXP && hasPremium;
              const isSelected = save.selPal === pal.id;
              const needsPremium = pal.premium && !save.isPremium;

              return (
                <TouchableOpacity
                  key={pal.id}
                  style={[
                    s.palCard,
                    isSelected && s.palCardSel,
                    !isSelectable && s.palCardLocked,
                  ]}
                  onPress={() => selectPal(pal)}
                  activeOpacity={0.85}
                >
                  {/* Premium shimmer overlay */}
                  {needsPremium && (
                    <View style={s.premiumOverlay}>
                      <Text style={s.premiumOverlayIcon}>👑</Text>
                    </View>
                  )}

                  <Text style={s.palEmoji}>{pal.emoji}</Text>
                  <Text style={s.palName}>{pal.name}</Text>

                  {isSelected && <Text style={s.selectedTick}>✓</Text>}

                  {needsPremium && !isSelected && (
                    <View style={s.lockBadge}>
                      <Text style={s.lockBadgeTxt}>PREMIUM</Text>
                    </View>
                  )}

                  {!needsPremium && !isSelected && !hasXP && (
                    <Text style={s.xpReq}>{pal.xpReq} XP</Text>
                  )}

                  {!needsPremium && !isSelected && hasXP && (
                    <Text style={s.unlocked}>Unlocked ✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Restore purchase link */}
          <TouchableOpacity
            onPress={() => navigation.navigate("Paywall", {})}
            style={s.restoreBtn}
          >
            <Text style={s.restoreTxt}>Already purchased? Restore here</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: 50 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  title: { fontFamily: fonts.displayBold, fontSize: 22, color: "white" },
  sub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    marginBottom: spacing.md,
  },

  premiumBanner: {
    borderRadius: radius.xl,
    overflow: "hidden",
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  premiumGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: 12,
  },
  premiumBannerIcon: { fontSize: 32 },
  premiumBannerTitle: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: "white",
    fontWeight: "800",
  },
  premiumBannerSub: {
    fontFamily: fonts.bodyReg,
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  premiumArrow: { fontFamily: fonts.displayBold, fontSize: 22, color: "white" },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: spacing.lg,
  },
  palCard: {
    width: "30%",
    flexGrow: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: radius.lg,
    padding: 14,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
    position: "relative",
    overflow: "hidden",
    ...shadows.sm,
  },
  palCardSel: {
    borderColor: "#FFD93D",
    backgroundColor: "rgba(255,217,61,0.1)",
  },
  palCardLocked: { opacity: 0.6 },

  premiumOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,217,61,0.2)",
    alignItems: "center",
    justifyContent: "center",
    margin: 4,
  },
  premiumOverlayIcon: { fontSize: 12 },

  palEmoji: { fontSize: 38, marginBottom: 6 },
  palName: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: "white",
    fontWeight: "800",
  },

  selectedTick: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: "#FFD93D",
    marginTop: 3,
  },
  lockBadge: {
    backgroundColor: "rgba(255,217,61,0.2)",
    borderRadius: 50,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  lockBadgeTxt: {
    fontFamily: fonts.body,
    fontSize: 9,
    color: "#FFD93D",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  xpReq: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    marginTop: 3,
  },
  unlocked: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: "#6BCB77",
    marginTop: 3,
  },

  restoreBtn: { alignItems: "center", paddingVertical: spacing.sm },
  restoreTxt: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: "rgba(255,255,255,0.3)",
  },
});
