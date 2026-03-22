// src/screens/GameScreen.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  Alert,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  EMOTIONS,
  PALS,
  STORY_LINES,
  DAILY_CHALLENGES,
} from "../data/gameData";
import { loadSave, patchSave, recordGameEnd } from "../hooks/useStorage";
import { colors, fonts, radius, shadows, spacing } from "../utils/theme";
import { Button, BackButton, Pill } from "../components/UI";

const SPEED_TIME = 4000;

export default function GameScreen({ navigation, route }) {
  const { mode = "classic" } = route.params || {};
  const insets = useSafeAreaInsets();

  // Game state
  const [gamePhase, setGamePhase] = useState("idle"); // idle | showing | player | gameover
  const [sequence, setSequence] = useState([]);
  const [playerIdx, setPlayerIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [save, setSave] = useState(null);
  const [litBtn, setLitBtn] = useState(null);
  const [currentEmo, setCurrentEmo] = useState(null);
  const [stageMsg, setStageMsg] = useState("Press Start!");
  const [storyLine, setStoryLine] = useState(null);
  const [sessionEmos, setSessionEmos] = useState({});

  // Speed timer
  const speedTimerRef = useRef(null);
  const [speedPct, setSpeedPct] = useState(1);
  const speedAnim = useRef(new Animated.Value(1)).current;

  // Pal animation
  const palScale = useRef(new Animated.Value(1)).current;
  const palRotate = useRef(new Animated.Value(0)).current;
  const palY = useRef(new Animated.Value(0)).current;

  // Seq ref for closures
  const seqRef = useRef([]);
  const playerIdxRef = useRef(0);
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const streakRef = useRef(0);
  const sessionEmosRef = useRef({});
  const gameActiveRef = useRef(false);

  useEffect(() => {
    loadSave().then(setSave);
    if (mode === "story") {
      setStoryLine(STORY_LINES[Math.floor(Math.random() * STORY_LINES.length)]);
    }
    return () => clearSpeedTimer();
  }, []);

  const currentPal = save
    ? PALS.find((p) => p.id === save.selPal) || PALS[0]
    : PALS[0];

  // ── Pal animations ─────────────────────────────────────────
  function animatePal(emoId) {
    palScale.setValue(1);
    palRotate.setValue(0);
    palY.setValue(0);

    const animations = {
      happy: () =>
        Animated.sequence([
          Animated.spring(palY, { toValue: -20, useNativeDriver: true }),
          Animated.spring(palY, { toValue: 0, useNativeDriver: true }),
        ]),
      silly: () =>
        Animated.sequence([
          Animated.timing(palRotate, {
            toValue: -0.2,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(palRotate, {
            toValue: 0.2,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(palRotate, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
      brave: () =>
        Animated.sequence([
          Animated.spring(palScale, { toValue: 1.3, useNativeDriver: true }),
          Animated.spring(palScale, { toValue: 1.0, useNativeDriver: true }),
        ]),
      shy: () =>
        Animated.sequence([
          Animated.spring(palScale, { toValue: 0.75, useNativeDriver: true }),
          Animated.spring(palScale, { toValue: 0.85, useNativeDriver: true }),
        ]),
      sleepy: () =>
        Animated.sequence([
          Animated.timing(palY, {
            toValue: 10,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(palRotate, {
            toValue: -0.15,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      angry: () =>
        Animated.sequence([
          Animated.timing(palRotate, {
            toValue: -0.1,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(palRotate, {
            toValue: 0.1,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(palRotate, {
            toValue: -0.1,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(palRotate, {
            toValue: 0,
            duration: 80,
            useNativeDriver: true,
          }),
        ]),
      excited: () =>
        Animated.sequence([
          Animated.spring(palScale, { toValue: 1.25, useNativeDriver: true }),
          Animated.spring(palScale, { toValue: 1.1, useNativeDriver: true }),
          Animated.spring(palScale, { toValue: 1.2, useNativeDriver: true }),
          Animated.spring(palScale, { toValue: 1.0, useNativeDriver: true }),
        ]),
      scared: () =>
        Animated.sequence([
          Animated.spring(palScale, { toValue: 0.8, useNativeDriver: true }),
          Animated.spring(palY, { toValue: 8, useNativeDriver: true }),
          Animated.spring(palScale, { toValue: 0.9, useNativeDriver: true }),
        ]),
    };

    const anim = animations[emoId];
    if (anim)
      anim().start(() => {
        palScale.setValue(1);
        palRotate.setValue(0);
        palY.setValue(0);
      });
  }

  function animateWrong() {
    Animated.sequence([
      Animated.timing(palRotate, {
        toValue: -0.15,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(palRotate, {
        toValue: 0.15,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(palRotate, {
        toValue: -0.1,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(palRotate, {
        toValue: 0,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }

  // ── Speed timer ────────────────────────────────────────────
  function startSpeedTimer() {
    if (mode !== "speed") return;
    speedAnim.setValue(1);
    setSpeedPct(1);
    const start = Date.now();
    speedTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 1 - elapsed / SPEED_TIME);
      setSpeedPct(pct);
      if (pct <= 0) {
        clearSpeedTimer();
        handleWrong();
      }
    }, 100);
  }
  function clearSpeedTimer() {
    if (speedTimerRef.current) {
      clearInterval(speedTimerRef.current);
      speedTimerRef.current = null;
    }
  }

  // ── Sequence logic ─────────────────────────────────────────
  async function startGame() {
    gameActiveRef.current = true;
    const newSeq = [];
    seqRef.current = newSeq;
    playerIdxRef.current = 0;
    scoreRef.current = 0;
    levelRef.current = 1;
    streakRef.current = 0;
    sessionEmosRef.current = {};
    setSequence(newSeq);
    setPlayerIdx(0);
    setScore(0);
    setLevel(1);
    setStreak(0);
    setGamePhase("showing");
    addToSequence(newSeq, 1);
  }

  async function addToSequence(currentSeq, currentLevel) {
    const next = Math.floor(Math.random() * EMOTIONS.length);
    const newSeq = [...currentSeq, next];
    seqRef.current = newSeq;
    setSequence(newSeq);
    playerIdxRef.current = 0;
    setPlayerIdx(0);
    setGamePhase("showing");
    setStageMsg("Watch carefully! 👀");

    const delay = Math.max(300, 700 - currentLevel * 25);
    const litDur = Math.max(200, 500 - currentLevel * 20);

    for (let i = 0; i < newSeq.length; i++) {
      await sleep(delay);
      if (!gameActiveRef.current) return;
      const displayIdx =
        mode === "mirror" ? newSeq[newSeq.length - 1 - i] : newSeq[i];
      const emo = EMOTIONS[displayIdx];
      setLitBtn(emo.id);
      setCurrentEmo(emo);
      animatePal(emo.id);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await sleep(litDur);
      setLitBtn(null);
    }

    await sleep(350);
    if (!gameActiveRef.current) return;
    setCurrentEmo(null);
    setGamePhase("player");
    if (mode === "speed") {
      setStageMsg("Quick! Show the feelings! ⚡");
      startSpeedTimer();
    } else {
      setStageMsg("Your turn! Show the feelings! 🎯");
    }
  }

  function handleEmoPress(emoId) {
    if (gamePhase !== "player") return;
    clearSpeedTimer();

    const seq = seqRef.current;
    const idx = playerIdxRef.current;
    const expected =
      mode === "mirror"
        ? EMOTIONS[seq[seq.length - 1 - idx]].id
        : EMOTIONS[seq[idx]].id;

    if (emoId === expected) {
      handleCorrect(emoId, idx, seq);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      animateWrong();
      handleWrong();
    }
  }

  function handleCorrect(emoId, idx, seq) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    streakRef.current += 1;
    const gain = 10 + (streakRef.current > 2 ? streakRef.current * 3 : 0);
    scoreRef.current += gain;
    setScore(scoreRef.current);
    setStreak(streakRef.current);

    // Track emotion
    sessionEmosRef.current[emoId] = (sessionEmosRef.current[emoId] || 0) + 1;
    setSessionEmos({ ...sessionEmosRef.current });

    const newIdx = idx + 1;
    playerIdxRef.current = newIdx;
    setPlayerIdx(newIdx);

    if (newIdx >= seq.length) {
      // Round complete
      scoreRef.current += levelRef.current * 8;
      streakRef.current += 1;
      setScore(scoreRef.current);
      setStreak(streakRef.current);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (seq.length % 3 === 0) {
        levelRef.current += 1;
        setLevel(levelRef.current);
        setStageMsg("🚀 Level Up! Amazing!");
      } else {
        const msgs = [
          "Fantastic! 🌟",
          "You got it! 💥",
          "Perfect echo! 🎯",
          "Great! ✨",
        ];
        setStageMsg(msgs[Math.floor(Math.random() * msgs.length)]);
      }

      setGamePhase("showing");
      setTimeout(
        () =>
          addToSequence(
            seq
              .concat([Math.floor(Math.random() * EMOTIONS.length)])
              .slice(-seq.length - 1),
            levelRef.current,
          ),
        900,
      );
    }
  }

  async function handleWrong() {
    if (!gameActiveRef.current) return;
    gameActiveRef.current = false;
    setGamePhase("gameover");
    setStageMsg("Oops! Keep trying! 💪");

    const finalSave = await recordGameEnd(
      scoreRef.current,
      levelRef.current,
      streakRef.current,
      sessionEmosRef.current,
    );
    setSave(finalSave);

    setTimeout(() => setGamePhase("gameover"), 500);
  }

  function quitGame() {
    gameActiveRef.current = false;
    clearSpeedTimer();
    navigation.goBack();
  }

  const palRotateDeg = palRotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-360deg", "360deg"],
  });

  const speedColor =
    speedPct > 0.5 ? colors.green : speedPct > 0.25 ? colors.gold : colors.red;

  // 25002500 Streak label 2014 fun emoji display 25002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500250025002500
  const streakLabel =
    streak >= 10
      ? "👑"
      : streak >= 8
        ? "⭐"
        : streak >= 5
          ? "⚡"
          : streak >= 3
            ? "🔥"
            : streak > 0
              ? streak + "×"
              : "—";

  // ── GAME OVER screen ───────────────────────────────────────
  if (gamePhase === "gameover") {
    const medal = score >= 150 ? "🏆" : score >= 60 ? "🥳" : currentPal.emoji;
    const title =
      score >= 150
        ? "Feelings Master! 🧠"
        : score >= 60
          ? "Great Feelings! 🌟"
          : "Nice Try! 💪";
    const sub =
      score >= 150
        ? "You understand emotions really well!"
        : score >= 60
          ? "Your emotional memory is growing!"
          : "Every game teaches you more about feelings!";

    return (
      <View style={styles.root}>
        <LinearGradient
          colors={["#c9e8ff", "#e8f4fd", "#d4f0e0"]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView
          style={[styles.overSafe, { paddingTop: insets.top }]}
          edges={["left", "right", "bottom"]}
        >
          <View style={styles.overCard}>
            <Text style={styles.overMedal}>{medal}</Text>
            <Text style={styles.overTitle}>{title}</Text>
            <Text style={styles.overSub}>{sub}</Text>

            <View style={styles.overStats}>
              {[
                { v: score, l: "Score" },
                { v: level, l: "Level" },
                { v: save?.best || 0, l: "Best" },
              ].map((s) => (
                <View key={s.l} style={styles.ostat}>
                  <Text style={styles.ostatV}>{s.v}</Text>
                  <Text style={styles.ostatL}>{s.l}</Text>
                </View>
              ))}
            </View>

            {/* Emotions echoed this game */}
            {Object.keys(sessionEmosRef.current).length > 0 && (
              <View style={styles.eosRow}>
                <Text style={styles.eosTitle}>Emotions you echoed:</Text>
                <View style={styles.eosTags}>
                  {Object.keys(sessionEmosRef.current).map((eid) => {
                    const e = EMOTIONS.find((x) => x.id === eid);
                    return e ? (
                      <View
                        key={eid}
                        style={[styles.eosTag, { backgroundColor: e.color }]}
                      >
                        <Text style={styles.eosTagTxt}>
                          {e.icon} {e.label}
                        </Text>
                      </View>
                    ) : null;
                  })}
                </View>
              </View>
            )}

            <Button
              label="Play Again! 🎮"
              onPress={startGame}
              variant="green"
              style={{ marginBottom: 10 }}
            />
            <Button label="Back Home" onPress={quitGame} variant="soft" />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── MAIN GAME ──────────────────────────────────────────────
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
      <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 12 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* HUD */}
          <View style={styles.hud}>
            <BackButton onPress={quitGame} />
            <View style={styles.hudPills}>
              <Pill value={score} label="Score" />
              <Pill value={level} label="Level" />
              <Pill value={streakLabel} label="Streak" />
            </View>
          </View>

          {/* Story bubble */}
          {mode === "story" && storyLine && (
            <View style={styles.storyBubble}>
              <Text style={styles.storyPal}>
                {(PALS.find((p) => p.id === storyLine.pal) || PALS[0]).emoji}
              </Text>
              <View style={styles.storyText}>
                <Text style={styles.storyName}>{storyLine.pal}</Text>
                <Text style={styles.storyLine}>{storyLine.text}</Text>
              </View>
            </View>
          )}

          {/* Speed bar */}
          {mode === "speed" && gamePhase === "player" && (
            <View style={styles.speedBar}>
              <View
                style={[
                  styles.speedFill,
                  { width: `${speedPct * 100}%`, backgroundColor: speedColor },
                ]}
              />
            </View>
          )}

          {/* Pal Stage */}
          <LinearGradient colors={["#e0f7ff", "#f0fff4"]} style={styles.stage}>
            <View
              style={[
                styles.emoLabelWrap,
                { backgroundColor: currentEmo?.color || "#ddd" },
              ]}
            >
              <Text style={styles.emoLabelText}>
                {currentEmo ? `${currentEmo.icon} ${currentEmo.label}` : "?"}
              </Text>
            </View>
            <Animated.Text
              style={[
                styles.stagePal,
                {
                  transform: [
                    { scale: palScale },
                    { rotate: palRotateDeg },
                    { translateY: palY },
                  ],
                },
              ]}
            >
              {currentPal.emoji}
            </Animated.Text>
            <Text style={styles.stageMsg}>{stageMsg}</Text>
          </LinearGradient>

          {/* Sequence dots */}
          <View style={styles.seqRow}>
            {sequence.map((idx, i) => (
              <View
                key={i}
                style={[
                  styles.seqDot,
                  i < playerIdx && {
                    backgroundColor: EMOTIONS[idx].color,
                    opacity: 0.4,
                  },
                  i === playerIdx &&
                    gamePhase === "player" && {
                      backgroundColor: EMOTIONS[idx].color,
                      transform: [{ scale: 1.3 }],
                    },
                ]}
              />
            ))}
          </View>

          {/* Level bar */}
          <View style={styles.levelRow}>
            <View style={[styles.lvlBadge]}>
              <Text style={styles.lvlBadgeTxt}>Level {level}</Text>
            </View>
            <View style={styles.lvlTrack}>
              <View
                style={[
                  styles.lvlFill,
                  { width: `${((sequence.length % 3) / 3) * 100}%` },
                ]}
              />
            </View>
          </View>

          {/* Emotion grid */}
          <View style={styles.emoGrid}>
            {EMOTIONS.map((e) => {
              const isLit = litBtn === e.id;
              return (
                <TouchableOpacity
                  key={e.id}
                  style={[
                    styles.emoBtn,
                    isLit && {
                      backgroundColor: e.color,
                      borderColor: e.color,
                      transform: [{ scale: 1.08 }],
                    },
                    gamePhase !== "player" && styles.emoBtnDisabled,
                  ]}
                  onPress={() => handleEmoPress(e.id)}
                  disabled={gamePhase !== "player"}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emoBtnIcon}>{e.icon}</Text>
                  <Text
                    style={[styles.emoBtnLabel, isLit && { color: "white" }]}
                  >
                    {e.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Start button */}
          {gamePhase === "idle" && (
            <Button
              label="▶ Start!"
              onPress={startGame}
              variant="green"
              style={styles.startBtn}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: spacing.lg, paddingTop: spacing.md, paddingBottom: 40 },

  hud: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  hudPills: { flexDirection: "row", gap: 8 },

  storyBubble: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 12,
    ...shadows.sm,
  },
  storyPal: { fontSize: 44 },
  storyText: { flex: 1 },
  storyName: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: colors.blue,
    marginBottom: 3,
  },
  storyLine: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.dark,
    lineHeight: 20,
  },

  speedBar: {
    height: 10,
    backgroundColor: "#eee",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  speedFill: { height: 10, borderRadius: 8 },

  stage: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.md,
    ...shadows.md,
    minHeight: 200,
    justifyContent: "center",
  },
  emoLabelWrap: {
    borderRadius: radius.full,
    paddingVertical: 6,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  emoLabelText: { fontFamily: fonts.display, fontSize: 20, color: "white" },
  stagePal: { fontSize: 88, marginBottom: 8 },
  stageMsg: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.mid,
    textAlign: "center",
  },

  seqRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    marginBottom: spacing.sm,
    minHeight: 28,
  },
  seqDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.5)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.8)",
  },

  levelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: spacing.md,
  },
  lvlBadge: {
    backgroundColor: colors.dark,
    borderRadius: radius.full,
    paddingVertical: 3,
    paddingHorizontal: 12,
  },
  lvlBadgeTxt: { fontFamily: fonts.display, fontSize: 13, color: "white" },
  lvlTrack: {
    flex: 1,
    height: 10,
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 8,
    overflow: "hidden",
  },
  lvlFill: { height: 10, backgroundColor: colors.green, borderRadius: 8 },

  emoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: spacing.md,
  },
  emoBtn: {
    width: "22%",
    flexGrow: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 10,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    ...shadows.sm,
  },
  emoBtnDisabled: { opacity: 0.55 },
  emoBtnIcon: { fontSize: 26, marginBottom: 3 },
  emoBtnLabel: {
    fontFamily: fonts.body,
    fontSize: 9,
    color: colors.mid,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  startBtn: { marginTop: 8 },

  // Game over
  overSafe: { flex: 1, justifyContent: "center", padding: spacing.lg },
  overCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: "center",
    ...shadows.lg,
  },
  overMedal: { fontSize: 72, marginBottom: 10 },
  overTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 30,
    color: colors.dark,
    marginBottom: 4,
    textAlign: "center",
  },
  overSub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.dim,
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 20,
  },
  overStats: { flexDirection: "row", gap: 12, marginBottom: 20 },
  ostat: {
    backgroundColor: "#f5faff",
    borderRadius: radius.md,
    padding: 12,
    minWidth: 80,
    alignItems: "center",
  },
  ostatV: { fontFamily: fonts.displayBold, fontSize: 26, color: colors.dark },
  ostatL: {
    fontFamily: fonts.body,
    fontSize: 9,
    color: colors.dim,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  eosRow: { marginBottom: 20, width: "100%" },
  eosTitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.dim,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  eosTags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  eosTag: {
    borderRadius: radius.full,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  eosTagTxt: { fontFamily: fonts.body, fontSize: 12, color: "white" },
});
