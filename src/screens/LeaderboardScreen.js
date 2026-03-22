// src/screens/LeaderboardScreen.js
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import {
  loadSave,
  patchSave,
  getDemoLeaderboard,
  createGroup,
  joinGroup,
  loadGroup,
  leaveGroup,
  getJourneyLevel,
  JOURNEY_LEVELS,
} from "../hooks/useStorage";
import { PALS } from "../data/gameData";
import { colors, fonts, radius, shadows, spacing } from "../utils/theme";
import { BackButton, Button, ProgressBar } from "../components/UI";

const TABS = ["🏆 Weekly", "👑 Journey", "👫 Friends"];

export default function LeaderboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [save, setSave] = useState(null);
  const [tab, setTab] = useState(0);
  const [group, setGroup] = useState(null);
  const [groupInput, setGroupInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [groupNameInput, setGroupNameInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadSave().then(async (d) => {
        setSave(d);
        setNameInput(d.playerName || "");
        if (d.groupCode) {
          const g = await loadGroup(d.groupCode);
          setGroup(g);
        }
      });
    }, []),
  );

  if (!save) return null;

  const pal = PALS.find((p) => p.id === save.selPal) || PALS[0];
  const lb = getDemoLeaderboard(save.weeklyScore, save.playerName, pal.emoji);
  const journey = getJourneyLevel(save.totalXP);
  const myRank = lb.find((m) => m.isYou)?.rank || "—";
  const medals = ["🥇", "🥈", "🥉"];

  // ── Handlers ──────────────────────────────────────────────
  async function handleCreate() {
    if (!nameInput.trim()) {
      Alert.alert("Enter your name first!");
      return;
    }
    if (!groupNameInput.trim()) {
      Alert.alert("Enter a group name!");
      return;
    }
    const code = await createGroup(
      groupNameInput.trim(),
      nameInput.trim(),
      pal.emoji,
    );
    const g = await loadGroup(code);
    setGroup(g);
    setSave(await loadSave());
    setCreating(false);
    Alert.alert(
      "Group Created! 🎉",
      `Your group code is: ${code}\nShare it with friends and family!`,
    );
  }

  async function handleJoin() {
    if (!nameInput.trim()) {
      Alert.alert("Enter your name first!");
      return;
    }
    if (groupInput.length < 4) {
      Alert.alert("Enter a 4-letter code!");
      return;
    }
    const g = await joinGroup(groupInput.trim(), nameInput.trim(), pal.emoji);
    if (!g) {
      Alert.alert("Group not found", "Check the code and try again.");
      return;
    }
    setGroup(g);
    setSave(await loadSave());
    setJoining(false);
  }

  async function handleLeave() {
    Alert.alert("Leave Group?", "You can rejoin anytime with the code.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          await leaveGroup();
          setGroup(null);
          setSave(await loadSave());
        },
      },
    ]);
  }

  async function saveName() {
    if (!nameInput.trim()) return;
    await patchSave({ playerName: nameInput.trim() });
    setSave(await loadSave());
    Alert.alert("Name saved! ✓");
  }

  // ── RENDER ─────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <LinearGradient
        colors={["#c9e8ff", "#e8f4fd", "#d4f0e0"]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }} edges={["left", "right", "bottom"]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={[s.scroll, { paddingTop: insets.top + 12 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={s.header}>
              <BackButton onPress={() => navigation.goBack()} />
              <Text style={s.title}>Leaderboards</Text>
              <View style={{ width: 44 }} />
            </View>

            {/* My rank banner */}
            <LinearGradient
              colors={["#1e2d3d", "#2d4a6e"]}
              style={s.rankBanner}
            >
              <Text style={s.rankPal}>{pal.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.rankName}>{save.playerName || "You"}</Text>
                <Text style={s.rankTitle}>
                  {journey.current.badge} {journey.current.title}
                </Text>
              </View>
              <View style={s.rankRight}>
                <Text style={s.rankNum}>#{myRank}</Text>
                <Text style={s.rankLbl}>This Week</Text>
              </View>
            </LinearGradient>

            {/* Tabs */}
            <View style={s.tabs}>
              {TABS.map((t, i) => (
                <TouchableOpacity
                  key={i}
                  style={[s.tab, tab === i && s.tabActive]}
                  onPress={() => setTab(i)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.tabTxt, tab === i && s.tabTxtActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── TAB 0: WEEKLY LEADERBOARD ── */}
            {tab === 0 && (
              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <Text style={s.sectionTitle}>This Week's Top Feelings</Text>
                  <Text style={s.sectionSub}>Resets every Monday</Text>
                </View>
                {lb.map((m, i) => (
                  <View key={i} style={[s.lbRow, m.isYou && s.lbRowYou]}>
                    <Text style={s.lbRank}>{medals[i] || `${m.rank}`}</Text>
                    <Text style={s.lbEmoji}>{m.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[s.lbName, m.isYou && { color: colors.blue }]}
                      >
                        {m.name}
                        {m.isYou ? " (You)" : ""}
                      </Text>
                      <Text style={s.lbScore}>Score: {m.weekScore}</Text>
                    </View>
                    {i === 0 && <Text style={s.lbCrown}>👑</Text>}
                  </View>
                ))}
                <View style={s.infoBox}>
                  <Text style={s.infoTxt}>
                    🔄 Leaderboard resets every Monday so everyone gets a fresh
                    start!
                  </Text>
                </View>
                {/* Personal bests */}
                <Text style={[s.sectionTitle, { marginTop: spacing.lg }]}>
                  🏆 Your Personal Bests
                </Text>
                {(save.personalBests || []).length === 0 ? (
                  <View style={s.emptyBox}>
                    <Text style={s.emptyTxt}>
                      Play a game to set your first personal best!
                    </Text>
                  </View>
                ) : (
                  save.personalBests.slice(0, 5).map((pb, i) => (
                    <View key={i} style={s.pbRow}>
                      <Text style={s.pbRank}>#{i + 1}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={s.pbScore}>{pb.score} pts</Text>
                        <Text style={s.pbDate}>
                          Level {pb.level} · {pb.date}
                        </Text>
                      </View>
                      {i === 0 && <Text style={{ fontSize: 18 }}>⭐</Text>}
                    </View>
                  ))
                )}
              </View>
            )}

            {/* ── TAB 1: JOURNEY LEVELS ── */}
            {tab === 1 && (
              <View style={s.section}>
                {/* Current level hero */}
                <LinearGradient
                  colors={["#1e2d3d", "#162640"]}
                  style={s.journeyHero}
                >
                  <Text style={s.jhBadge}>{journey.current.badge}</Text>
                  <Text style={s.jhTitle}>{journey.current.title}</Text>
                  <Text style={s.jhXP}>{save.totalXP} XP total</Text>
                  {journey.next && (
                    <>
                      <View style={s.jhBarWrap}>
                        <ProgressBar
                          pct={journey.pct}
                          color={colors.gold}
                          height={10}
                        />
                      </View>
                      <Text style={s.jhNext}>
                        Next: {journey.next.badge} {journey.next.title} —{" "}
                        {journey.next.xpReq - save.totalXP} XP away
                      </Text>
                    </>
                  )}
                  {!journey.next && (
                    <Text style={s.jhNext}>
                      🎉 Maximum level reached! You're a Legend!
                    </Text>
                  )}
                </LinearGradient>

                {/* All levels */}
                <Text style={[s.sectionTitle, { marginBottom: spacing.md }]}>
                  All Journey Levels
                </Text>
                {JOURNEY_LEVELS.map((jl, i) => {
                  const reached = save.totalXP >= jl.xpReq;
                  const isCurrent = jl.level === journey.current.level;
                  return (
                    <View
                      key={i}
                      style={[
                        s.jlRow,
                        isCurrent && s.jlRowActive,
                        !reached && s.jlRowLocked,
                      ]}
                    >
                      <Text style={s.jlBadge}>{jl.badge}</Text>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            s.jlTitle,
                            isCurrent && { color: colors.blue },
                          ]}
                        >
                          {jl.title}
                          {isCurrent ? " ← You are here" : ""}
                        </Text>
                        <Text style={s.jlReq}>
                          {jl.xpReq === 0
                            ? "Starting level"
                            : `${jl.xpReq} XP required`}
                        </Text>
                      </View>
                      {reached && <Text style={{ fontSize: 16 }}>✓</Text>}
                      {!reached && <Text style={{ fontSize: 16 }}>🔒</Text>}
                    </View>
                  );
                })}

                <View style={s.infoBox}>
                  <Text style={s.infoTxt}>
                    💡 Earn XP by playing games. Every session adds XP toward
                    your next level!
                  </Text>
                </View>
              </View>
            )}

            {/* ── TAB 2: FRIENDS GROUP ── */}
            {tab === 2 && (
              <View style={s.section}>
                {/* Name setting */}
                <View style={s.nameCard}>
                  <Text style={s.nameLabel}>Your Display Name</Text>
                  <View style={s.nameRow}>
                    <TextInput
                      style={s.nameInput}
                      value={nameInput}
                      onChangeText={setNameInput}
                      placeholder="Enter your name..."
                      maxLength={12}
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      style={s.nameSaveBtn}
                      onPress={saveName}
                      activeOpacity={0.8}
                    >
                      <Text style={s.nameSaveTxt}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* In a group */}
                {save.groupCode ? (
                  <>
                    <View style={s.groupBanner}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.groupBannerName}>
                          {save.groupName || "My Group"}
                        </Text>
                        <Text style={s.groupBannerCode}>
                          Code: {save.groupCode}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={handleLeave}
                        style={s.leaveBtn}
                      >
                        <Text style={s.leaveTxt}>Leave</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Group leaderboard */}
                    {group &&
                      group.members
                        .sort((a, b) => (b.weekScore || 0) - (a.weekScore || 0))
                        .map((m, i) => (
                          <View
                            key={i}
                            style={[
                              s.lbRow,
                              m.name === save.playerName && s.lbRowYou,
                            ]}
                          >
                            <Text style={s.lbRank}>
                              {medals[i] || `${i + 1}`}
                            </Text>
                            <Text style={s.lbEmoji}>{m.emoji || "🐼"}</Text>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={[
                                  s.lbName,
                                  m.name === save.playerName && {
                                    color: colors.blue,
                                  },
                                ]}
                              >
                                {m.name}
                                {m.name === save.playerName ? " (You)" : ""}
                                {m.isOwner ? " 👑" : ""}
                              </Text>
                              <Text style={s.lbScore}>
                                Score: {m.weekScore || 0}
                              </Text>
                            </View>
                          </View>
                        ))}
                    <View style={s.infoBox}>
                      <Text style={s.infoTxt}>
                        📤 Share your group code{" "}
                        <Text
                          style={{
                            fontFamily: fonts.display,
                            color: colors.dark,
                          }}
                        >
                          {save.groupCode}
                        </Text>{" "}
                        with friends and family to play together!
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    {/* Create group */}
                    {!creating && !joining && (
                      <View style={s.groupOptions}>
                        <Text style={s.groupOptionsTitle}>
                          Play with Friends & Family 👫
                        </Text>
                        <Text style={s.groupOptionsSub}>
                          Create a private group and share your code. Only
                          people with the code can join — completely safe for
                          kids.
                        </Text>
                        <Button
                          label="Create a Group 🏠"
                          onPress={() => setCreating(true)}
                          variant="green"
                          style={{ marginBottom: 10 }}
                        />
                        <Button
                          label="Join a Group 🔑"
                          onPress={() => setJoining(true)}
                          variant="blue"
                        />
                      </View>
                    )}

                    {/* Create form */}
                    {creating && (
                      <View style={s.groupForm}>
                        <Text style={s.formTitle}>Create a Group</Text>
                        <TextInput
                          style={s.formInput}
                          placeholder="Group name (e.g. The Smith Family)"
                          value={groupNameInput}
                          onChangeText={setGroupNameInput}
                          maxLength={24}
                        />
                        <Button
                          label="Create Group 🎉"
                          onPress={handleCreate}
                          variant="green"
                          style={{ marginBottom: 10 }}
                        />
                        <Button
                          label="Cancel"
                          onPress={() => setCreating(false)}
                          variant="soft"
                        />
                      </View>
                    )}

                    {/* Join form */}
                    {joining && (
                      <View style={s.groupForm}>
                        <Text style={s.formTitle}>Join a Group</Text>
                        <TextInput
                          style={[s.formInput, s.codeInput]}
                          placeholder="ABCD"
                          value={groupInput}
                          onChangeText={(t) => setGroupInput(t.toUpperCase())}
                          maxLength={4}
                          autoCapitalize="characters"
                          autoCorrect={false}
                        />
                        <Button
                          label="Join Group 🚀"
                          onPress={handleJoin}
                          variant="blue"
                          style={{ marginBottom: 10 }}
                        />
                        <Button
                          label="Cancel"
                          onPress={() => setJoining(false)}
                          variant="soft"
                        />
                      </View>
                    )}
                  </>
                )}

                {/* Classroom info */}
                <View
                  style={[
                    s.infoBox,
                    { marginTop: spacing.md, backgroundColor: "#e8f7ff" },
                  ]}
                >
                  <Text style={[s.infoTxt, { color: colors.blue }]}>
                    🏫 Teacher? Use Classroom Mode in the Parent Dashboard to
                    set up a class leaderboard for your students.
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: spacing.lg, paddingTop: spacing.md, paddingBottom: 60 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  title: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.dark },

  rankBanner: {
    borderRadius: radius.xl,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: spacing.md,
    ...shadows.lg,
  },
  rankPal: { fontSize: 44 },
  rankName: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: "white",
    fontWeight: "800",
  },
  rankTitle: {
    fontFamily: fonts.bodyReg,
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },
  rankRight: { alignItems: "center" },
  rankNum: { fontFamily: fonts.displayBold, fontSize: 32, color: colors.gold },
  rankLbl: {
    fontFamily: fonts.body,
    fontSize: 9,
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  tabs: { flexDirection: "row", gap: 8, marginBottom: spacing.md },
  tab: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 50,
    padding: 10,
    alignItems: "center",
    ...shadows.sm,
  },
  tabActive: { backgroundColor: colors.dark },
  tabTxt: { fontFamily: fonts.display, fontSize: 11, color: colors.dark },
  tabTxtActive: { color: "white" },

  section: { gap: 0 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.dark,
    fontWeight: "800",
  },
  sectionSub: { fontFamily: fonts.body, fontSize: 11, color: colors.dim },

  lbRow: {
    backgroundColor: "white",
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
    ...shadows.sm,
  },
  lbRowYou: { borderWidth: 2, borderColor: colors.blue },
  lbRank: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    minWidth: 32,
    textAlign: "center",
  },
  lbEmoji: { fontSize: 30 },
  lbName: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.dark,
    fontWeight: "800",
  },
  lbScore: {
    fontFamily: fonts.bodyReg,
    fontSize: 11,
    color: colors.dim,
    marginTop: 2,
  },
  lbCrown: { fontSize: 20 },

  infoBox: {
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  infoTxt: {
    fontFamily: fonts.bodyReg,
    fontSize: 12,
    color: colors.mid,
    lineHeight: 18,
  },
  emptyBox: {
    backgroundColor: "white",
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: "center",
    ...shadows.sm,
  },
  emptyTxt: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.dim,
    textAlign: "center",
  },

  pbRow: {
    backgroundColor: "white",
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
    ...shadows.sm,
  },
  pbRank: {
    fontFamily: fonts.displayBold,
    fontSize: 16,
    color: colors.dim,
    minWidth: 28,
  },
  pbScore: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.dark,
    fontWeight: "800",
  },
  pbDate: {
    fontFamily: fonts.bodyReg,
    fontSize: 10,
    color: colors.dim,
    marginTop: 2,
  },

  journeyHero: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  jhBadge: { fontSize: 64, marginBottom: 8 },
  jhTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 26,
    color: "white",
    marginBottom: 4,
  },
  jhXP: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 14,
  },
  jhBarWrap: { width: "100%", marginBottom: 8 },
  jhNext: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
  },

  jlRow: {
    backgroundColor: "white",
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
    ...shadows.sm,
    opacity: 0.5,
  },
  jlRowActive: { opacity: 1, borderWidth: 2, borderColor: colors.blue },
  jlRowLocked: { opacity: 0.35 },
  jlBadge: { fontSize: 28 },
  jlTitle: {
    fontFamily: fonts.display,
    fontSize: 14,
    color: colors.dark,
    fontWeight: "800",
  },
  jlReq: {
    fontFamily: fonts.bodyReg,
    fontSize: 11,
    color: colors.dim,
    marginTop: 2,
  },

  nameCard: {
    backgroundColor: "white",
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  nameLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.dim,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  nameRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  nameInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#eee",
    borderRadius: radius.md,
    padding: 10,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.dark,
  },
  nameSaveBtn: {
    backgroundColor: colors.green,
    borderRadius: radius.md,
    padding: 10,
    paddingHorizontal: 16,
  },
  nameSaveTxt: {
    fontFamily: fonts.display,
    fontSize: 14,
    color: "white",
    fontWeight: "800",
  },

  groupBanner: {
    backgroundColor: colors.dark,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    ...shadows.md,
  },
  groupBannerName: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: "white",
    fontWeight: "800",
  },
  groupBannerCode: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    marginTop: 2,
  },
  leaveBtn: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: radius.md,
    padding: 8,
    paddingHorizontal: 14,
  },
  leaveTxt: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },

  groupOptions: {
    backgroundColor: "white",
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  groupOptionsTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: colors.dark,
    marginBottom: 8,
  },
  groupOptionsSub: {
    fontFamily: fonts.bodyReg,
    fontSize: 13,
    color: colors.dim,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },

  groupForm: {
    backgroundColor: "white",
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.md,
    marginBottom: spacing.md,
  },
  formTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: colors.dark,
    marginBottom: spacing.md,
  },
  formInput: {
    borderWidth: 2,
    borderColor: "#eee",
    borderRadius: radius.md,
    padding: 12,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.dark,
    marginBottom: spacing.md,
  },
  codeInput: {
    textAlign: "center",
    fontFamily: fonts.displayBold,
    fontSize: 32,
    letterSpacing: 8,
  },
});
