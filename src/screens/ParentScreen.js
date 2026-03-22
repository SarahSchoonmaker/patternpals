// src/screens/ParentScreen.js
import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { EMOTIONS, ACHIEVEMENTS } from "../data/gameData";
import { loadSave } from "../hooks/useStorage";
import { colors, fonts, radius, shadows, spacing } from "../utils/theme";
import { BackButton, Card, SectionTitle, ProgressBar } from "../components/UI";

export default function ParentScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [save, setSave] = useState(null);
  useFocusEffect(
    useCallback(() => {
      loadSave().then(setSave);
    }, []),
  );
  if (!save) return null;

  const emoCount = Object.keys(save.emoCounts || {}).length;
  const ws = save.weekScores || [0, 0, 0, 0, 0, 0, 0];
  const maxWS = Math.max(...ws, 1);
  const days = ["S", "M", "T", "W", "T", "F", "S"];

  const skills = [
    {
      name: "Emotional Recognition",
      color: colors.gold,
      pct: Math.min(100, emoCount * 12.5),
      desc: "Identifying different feelings in others",
    },
    {
      name: "Working Memory",
      color: colors.blue,
      pct: Math.min(100, (save.best || 0) / 2),
      desc: "Holding sequences in mind while acting",
    },
    {
      name: "Self-Regulation",
      color: colors.green,
      pct: Math.min(100, (save.maxLevel || 0) * 12),
      desc: "Staying calm and focused under pressure",
    },
    {
      name: "Empathy",
      color: colors.pink,
      pct: Math.min(
        100,
        ((save.emoCounts?.shy || 0) +
          (save.emoCounts?.scared || 0) +
          (save.emoCounts?.angry || 0)) *
          15,
      ),
      desc: "Understanding and sharing others' feelings",
    },
    {
      name: "Attention & Focus",
      color: colors.purple,
      pct: Math.min(100, (save.sessions || 0) * 10),
      desc: "Sustained concentration over time",
    },
  ];

  const insights = [];
  if (emoCount >= 6)
    insights.push({
      icon: "🌟",
      title: "Rich Emotional Vocabulary",
      body: `Your child has explored ${emoCount} of 8 emotions — excellent for this age group.`,
    });
  if ((save.streak || 0) >= 3)
    insights.push({
      icon: "🔥",
      title: "Great Daily Habit!",
      body: `${save.streak}-day streak. Consistency shows commitment to learning.`,
    });
  if ((save.best || 0) >= 100)
    insights.push({
      icon: "🧠",
      title: "Strong Memory Skills",
      body: "Scores above 100 indicate above-average working memory for ages 6–12.",
    });
  if ((save.emoCounts?.angry || 0) > 3)
    insights.push({
      icon: "💡",
      title: "Anger Awareness",
      body: "Practicing anger recognition helps children label and manage strong emotions.",
    });
  if (!insights.length)
    insights.push({
      icon: "📊",
      title: "Keep Playing!",
      body: "More sessions = more data = better insights about your child's growth.",
    });

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
            <Text style={styles.title}>👨‍👩‍👧 Parent View</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Quick stats */}
          <View style={styles.statsRow}>
            {[
              { v: save.sessions, l: "Sessions", icon: "🎮" },
              { v: save.best, l: "Best Score", icon: "🏆" },
              { v: save.streak, l: "Day Streak", icon: "🔥" },
            ].map((s) => (
              <View key={s.l} style={styles.statBox}>
                <Text style={styles.statIcon}>{s.icon}</Text>
                <Text style={styles.statVal}>{s.v}</Text>
                <Text style={styles.statLbl}>{s.l}</Text>
              </View>
            ))}
          </View>

          {/* SEL Skills */}
          <Card style={styles.section}>
            <SectionTitle>🧠 SEL Skills Progress</SectionTitle>
            {skills.map((s) => (
              <View key={s.name} style={styles.skillRow}>
                <View style={styles.skillTop}>
                  <Text style={styles.skillName}>{s.name}</Text>
                  <Text style={[styles.skillPct, { color: s.color }]}>
                    {s.pct}%
                  </Text>
                </View>
                <ProgressBar
                  pct={s.pct}
                  color={s.color}
                  style={{ marginBottom: 4 }}
                />
                <Text style={styles.skillDesc}>{s.desc}</Text>
              </View>
            ))}
          </Card>

          {/* Emotions explored */}
          <Card style={styles.section}>
            <SectionTitle>💡 Emotions Explored</SectionTitle>
            <View style={styles.emoTags}>
              {EMOTIONS.map((e) => {
                const cnt = save.emoCounts?.[e.id] || 0;
                return (
                  <View
                    key={e.id}
                    style={[
                      styles.emoTag,
                      { backgroundColor: cnt > 0 ? e.color : "#eee" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.emoTagTxt,
                        { color: cnt > 0 ? "white" : "#bbb" },
                      ]}
                    >
                      {e.icon} {e.label} {cnt > 0 ? `(${cnt})` : ""}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Card>

          {/* Week chart */}
          <Card style={styles.section}>
            <SectionTitle>📅 This Week's Scores</SectionTitle>
            <View style={styles.chartRow}>
              {ws.map((s, i) => {
                const h = Math.max(4, Math.round((s / maxWS) * 80));
                const barColors = [
                  colors.red,
                  colors.gold,
                  colors.green,
                  colors.blue,
                  colors.orange,
                  colors.purple,
                  colors.red,
                ];
                return (
                  <View key={i} style={styles.barCol}>
                    <View
                      style={[
                        styles.bar,
                        { height: h, backgroundColor: barColors[i] },
                      ]}
                    />
                    <Text style={styles.barLbl}>{days[i]}</Text>
                  </View>
                );
              })}
            </View>
          </Card>

          {/* Insights */}
          <LinearGradient
            colors={[colors.blue, colors.green]}
            style={[
              styles.section,
              { borderRadius: radius.xl, padding: spacing.lg },
            ]}
          >
            <Text style={[styles.title, { color: "white", marginBottom: 12 }]}>
              💬 What This Means
            </Text>
            {insights.map((ins, i) => (
              <View key={i} style={styles.insightRow}>
                <Text style={styles.insightIcon}>{ins.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.insightTitle}>{ins.title}</Text>
                  <Text style={styles.insightBody}>{ins.body}</Text>
                </View>
              </View>
            ))}
          </LinearGradient>

          {/* Achievements */}
          <Card style={styles.section}>
            <SectionTitle>🏆 Achievements</SectionTitle>
            <View style={styles.achieveGrid}>
              {ACHIEVEMENTS.map((a) => {
                const earned = a.check(save);
                return (
                  <View
                    key={a.id}
                    style={[
                      styles.achieveCard,
                      !earned && styles.achieveCardLocked,
                    ]}
                  >
                    <Text style={styles.achieveIcon}>{a.icon}</Text>
                    <Text style={styles.achieveName}>{a.name}</Text>
                    <Text style={styles.achieveDesc}>{a.desc}</Text>
                    {earned && (
                      <Text style={styles.achieveEarned}>✓ Earned</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </Card>
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
    marginBottom: spacing.lg,
  },
  title: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.dark },
  section: { marginBottom: spacing.md },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: spacing.md },
  statBox: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 12,
    alignItems: "center",
    ...shadows.sm,
  },
  statIcon: { fontSize: 24, marginBottom: 4 },
  statVal: { fontFamily: fonts.displayBold, fontSize: 24, color: colors.dark },
  statLbl: {
    fontFamily: fonts.body,
    fontSize: 9,
    color: colors.dim,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  skillRow: { marginBottom: 14 },
  skillTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  skillName: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.dark,
    fontWeight: "800",
  },
  skillPct: { fontFamily: fonts.display, fontSize: 13 },
  skillDesc: {
    fontFamily: fonts.bodyReg,
    fontSize: 10,
    color: colors.dim,
    marginTop: 2,
  },

  emoTags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  emoTag: {
    borderRadius: radius.full,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  emoTagTxt: { fontFamily: fonts.body, fontSize: 12 },

  chartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 100,
    gap: 6,
  },
  barCol: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 4 },
  bar: { width: "100%", borderRadius: 5, minHeight: 4 },
  barLbl: { fontFamily: fonts.body, fontSize: 9, color: colors.dim },

  insightRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  insightIcon: { fontSize: 24 },
  insightTitle: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: "white",
    marginBottom: 2,
  },
  insightBody: {
    fontFamily: fonts.bodyReg,
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 16,
  },

  achieveGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  achieveCard: {
    width: "47%",
    backgroundColor: colors.light,
    borderRadius: radius.md,
    padding: 12,
  },
  achieveCardLocked: { opacity: 0.4 },
  achieveIcon: { fontSize: 26, marginBottom: 4 },
  achieveName: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: colors.dark,
    marginBottom: 2,
  },
  achieveDesc: { fontFamily: fonts.bodyReg, fontSize: 10, color: colors.dim },
  achieveEarned: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.green,
    marginTop: 4,
  },
});
