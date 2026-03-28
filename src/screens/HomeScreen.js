// src/screens/HomeScreen.js
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import {
  loadSave,
  getFeelingOfDay,
  getJourneyLevel,
  patchSave,
} from "../hooks/useStorage";
import { PALS, DAILY_CHALLENGES, EMOTIONS } from "../data/gameData";
import { colors, fonts, radius, shadows, spacing } from "../utils/theme";
import { Pill, Button } from "../components/UI";

const { width } = Dimensions.get("window");

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [save, setSave] = useState(null);
  const [logoTaps, setLogoTaps] = useState(0);

  async function handleLogoTap() {
    const newCount = logoTaps + 1;
    setLogoTaps(newCount);
    if (newCount >= 7) {
      setLogoTaps(0);
      const updated = await patchSave({ isPremium: true, totalXP: 500 });
      setSave(updated);
      alert("🎉 Dev Mode: Premium unlocked!");
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadSave().then(setSave);
    }, []),
  );

  if (!save) return null;

  const unlockedPals = PALS.filter((p) => save.totalXP >= p.xpReq);
  const today = new Date().toDateString();
  const dailyDone = save.dailyDone === today;
  const todayChallenge =
    DAILY_CHALLENGES[
      Math.floor(Date.now() / 86400000) % DAILY_CHALLENGES.length
    ];
  const xpPct = save.xp % 100;
  const fotdId = getFeelingOfDay();
  const fotdEmotion = EMOTIONS.find((e) => e.id === fotdId) || EMOTIONS[0];
  const fotdClaimed = save.fotdDone === today;
  const journey = getJourneyLevel(save.totalXP);

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />
      <LinearGradient
        colors={["#c9e8ff", "#e8f4fd", "#d4f0e0"]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleLogoTap} activeOpacity={0.8}>
            <Text style={styles.logo}>🐾 Pal Feelings</Text>
          </TouchableOpacity>
          <View style={styles.topBtns}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate("Leaderboard")}
            >
              <Text style={styles.iconBtnText}>🏆</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate("Journal")}
            >
              <Text style={styles.iconBtnText}>📖</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate("Parent")}
            >
              <Text style={styles.iconBtnText}>👨‍👩‍👧</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero world card */}
        <LinearGradient
          colors={["#d0f0ff", "#e8ffd0"]}
          style={styles.heroCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.heroTitle}>
            Pal <Text style={{ color: colors.blue }}>Feelings</Text>
          </Text>
          <Text style={styles.heroSub}>Memory · Emotions · Fun</Text>

          <View style={styles.palRow}>
            {unlockedPals.slice(0, 5).map((p, i) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.palBubble, { marginTop: i % 2 === 0 ? 0 : 8 }]}
                onPress={() => navigation.navigate("PalSelect")}
                activeOpacity={0.8}
              >
                <Text style={styles.palEmoji}>{p.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.xpRow}>
            <Text style={styles.xpLbl}>⭐ XP</Text>
            <Text style={styles.xpVal}>{save.totalXP} XP total</Text>
          </View>
          <View style={styles.xpTrack}>
            <View style={[styles.xpFill, { width: `${xpPct}%` }]} />
          </View>
        </LinearGradient>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { v: save.streak, l: "🔥 Streak" },
            { v: save.best, l: "🏆 Best" },
            { v: Object.keys(save.emoCounts || {}).length, l: "💡 Feelings" },
          ].map((s) => (
            <Pill key={s.l} value={s.v} label={s.l} style={styles.statPill} />
          ))}
        </View>

        {/* Feeling of the Day */}
        <TouchableOpacity
          style={[styles.fotdCard, { borderColor: fotdEmotion.color + "60" }]}
          onPress={() => navigation.navigate("FeelingOfDay")}
          activeOpacity={0.85}
        >
          <Text style={styles.fotdEmoji}>{fotdEmotion.icon}</Text>
          <View style={styles.fotdInfo}>
            <Text style={styles.fotdLabel}>Today's Feeling</Text>
            <Text style={[styles.fotdName, { color: fotdEmotion.color }]}>
              {fotdEmotion.label}
            </Text>
            <Text style={styles.fotdSub}>{fotdEmotion.desc}</Text>
          </View>
          <View
            style={[
              styles.fotdBadge,
              {
                backgroundColor: fotdClaimed ? "#6BCB77" : fotdEmotion.color,
              },
            ]}
          >
            <Text style={styles.fotdBadgeTxt}>
              {fotdClaimed ? "✓" : "+50 XP"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Journey level */}
        <TouchableOpacity
          style={styles.journeyCard}
          onPress={() => navigation.navigate("Leaderboard")}
          activeOpacity={0.85}
        >
          <Text style={styles.journeyBadge}>{journey.current.badge}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.journeyTitle}>{journey.current.title}</Text>
            <View style={styles.journeyBarWrap}>
              <View style={[styles.journeyBar, { width: journey.pct + "%" }]} />
            </View>
          </View>
          <Text style={styles.journeyArrow}>🏆 ›</Text>
        </TouchableOpacity>

        {/* Daily challenge */}
        <TouchableOpacity
          style={styles.dailyCard}
          onPress={() => navigation.navigate("Game", { mode: "classic" })}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={dailyDone ? ["#ddd", "#ccc"] : [colors.orange, colors.gold]}
            style={styles.dailyGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.dailyIcon}>{todayChallenge.badge}</Text>
            <View style={styles.dailyInfo}>
              <Text style={styles.dailyTitle}>Daily Challenge</Text>
              <Text style={styles.dailySub}>
                {dailyDone ? "✓ Completed!" : todayChallenge.title}
              </Text>
            </View>
            <Text style={styles.dailyXP}>
              {dailyDone ? "✓" : `+${todayChallenge.xpReward} XP`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Mode grid */}
        <View style={styles.modeGrid}>
          {[
            {
              icon: "🧠",
              title: "Classic",
              sub: "Watch & show back",
              mode: "classic",
              color: ["#d0f0ff", "#b8e4ff"],
            },
            {
              icon: "⚡",
              title: "Speed",
              sub: "Beat the clock",
              mode: "speed",
              color: ["#fff0d0", "#ffe4b0"],
            },
            {
              icon: "🪞",
              title: "Mirror",
              sub: "Reverse it!",
              mode: "mirror",
              color: ["#f0d0ff", "#e4b8ff"],
            },
            {
              icon: "📖",
              title: "Story",
              sub: "Help your Pal!",
              mode: "story",
              color: ["#d0ffd8", "#b8ffcc"],
            },
          ].map((m) => (
            <TouchableOpacity
              key={m.mode}
              activeOpacity={0.85}
              style={styles.modeCard}
              onPress={() => {
                if (m.mode !== "classic" && !save.isPremium) {
                  navigation.navigate("Paywall", {});
                } else {
                  navigation.navigate("Game", { mode: m.mode });
                }
              }}
            >
              <LinearGradient colors={m.color} style={styles.modeGradient}>
                <Text style={styles.modeIcon}>{m.icon}</Text>
                <Text style={styles.modeTitle}>{m.title}</Text>
                <Text style={styles.modeSub}>{m.sub}</Text>
                {m.mode !== "classic" && !save.isPremium && (
                  <View style={styles.modeLockBadge}>
                    <Text style={styles.modeLockTxt}>👑 Premium</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          label="🎭 My Pals"
          onPress={() => navigation.navigate("PalSelect")}
          variant="soft"
          style={{ marginTop: 4 }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: 60 },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  logo: { fontFamily: fonts.displayBold, fontSize: 24, color: colors.dark },
  topBtns: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  iconBtnText: { fontSize: 20 },

  heroCard: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.lg,
  },
  heroTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 38,
    color: colors.dark,
    lineHeight: 42,
  },
  heroSub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: "#6BCB77",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: spacing.md,
  },
  palRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: spacing.md,
    flexWrap: "wrap",
  },
  palBubble: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  palEmoji: { fontSize: 32 },
  xpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  xpLbl: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.dim,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  xpVal: { fontFamily: fonts.display, fontSize: 13, color: colors.dark },
  xpTrack: {
    height: 12,
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: 8,
    overflow: "hidden",
  },
  xpFill: { height: 12, backgroundColor: colors.gold, borderRadius: 8 },

  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: spacing.md,
    justifyContent: "center",
  },
  statPill: { flex: 1 },

  fotdCard: {
    backgroundColor: "white",
    borderRadius: radius.xl,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: spacing.md,
    borderWidth: 2,
    ...shadows.md,
  },
  fotdEmoji: { fontSize: 44 },
  fotdInfo: { flex: 1 },
  fotdLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.dim,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  fotdName: { fontFamily: fonts.displayBold, fontSize: 18 },
  fotdSub: {
    fontFamily: fonts.bodyReg,
    fontSize: 11,
    color: colors.mid,
    marginTop: 2,
  },
  fotdBadge: { borderRadius: 50, paddingVertical: 6, paddingHorizontal: 12 },
  fotdBadgeTxt: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: "white",
    fontWeight: "800",
  },

  journeyCard: {
    backgroundColor: colors.dark,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  journeyBadge: { fontSize: 28 },
  journeyTitle: {
    fontFamily: fonts.display,
    fontSize: 14,
    color: "white",
    fontWeight: "800",
    marginBottom: 6,
  },
  journeyBarWrap: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 6,
    overflow: "hidden",
  },
  journeyBar: { height: 6, backgroundColor: colors.gold, borderRadius: 6 },
  journeyArrow: { fontFamily: fonts.display, fontSize: 14, color: colors.gold },

  dailyCard: {
    borderRadius: radius.xl,
    overflow: "hidden",
    marginBottom: spacing.md,
    ...shadows.md,
  },
  dailyGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: 12,
  },
  dailyIcon: { fontSize: 36 },
  dailyInfo: { flex: 1 },
  dailyTitle: { fontFamily: fonts.display, fontSize: 16, color: "white" },
  dailySub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  dailyXP: { fontFamily: fonts.display, fontSize: 16, color: "white" },

  modeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: spacing.md,
  },
  modeCard: {
    width: (width - spacing.lg * 2 - 12) / 2,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadows.md,
  },
  modeGradient: { padding: spacing.md, alignItems: "center" },
  modeIcon: { fontSize: 38, marginBottom: 6 },
  modeTitle: { fontFamily: fonts.display, fontSize: 17, color: colors.dark },
  modeSub: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.mid,
    marginTop: 3,
  },
  modeLockBadge: {
    backgroundColor: "rgba(255,217,61,0.15)",
    borderRadius: 50,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginTop: 5,
  },
  modeLockTxt: {
    fontFamily: fonts.body,
    fontSize: 9,
    color: colors.gold,
    fontWeight: "800",
  },
});
