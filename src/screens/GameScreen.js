// src/screens/GameScreen.js
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { EMOTIONS, PALS, STORY_LINES } from "../data/gameData";
import { loadSave, recordGameEnd } from "../hooks/useStorage";
import { colors, fonts, radius, shadows, spacing } from "../utils/theme";
import { Button, BackButton, Pill } from "../components/UI";

const SPEED_TIME = 4000;

// ── WORLDS ──────────────────────────────────────────────────
const WORLDS = [
  {
    level: 1,
    name: "Sunny Meadow",
    emoji: "🌸",
    colors: ["#d4f0e0", "#e8ffd0", "#c9e8ff"],
    stageColors: ["#e8ffd0", "#d4f7ea"],
    ground: "rgba(107,203,119,0.15)",
  },
  {
    level: 3,
    name: "Twilight Forest",
    emoji: "🌙",
    colors: ["#2d1b4e", "#4a2d7a", "#1a3a5c"],
    stageColors: ["#3d2060", "#2d1b4e"],
    ground: "rgba(199,125,255,0.2)",
  },
  {
    level: 5,
    name: "Starry Night",
    emoji: "✨",
    colors: ["#0a0a2e", "#1a1a4e", "#0d1b3e"],
    stageColors: ["#12124a", "#0a0a2e"],
    ground: "rgba(77,150,255,0.15)",
  },
  {
    level: 7,
    name: "Volcano Island",
    emoji: "🌋",
    colors: ["#3d0a00", "#7a1a00", "#2d0500"],
    stageColors: ["#5a0f00", "#3d0a00"],
    ground: "rgba(255,107,107,0.2)",
  },
  {
    level: 9,
    name: "Galaxy Space",
    emoji: "🌌",
    colors: ["#000010", "#0a0a1e", "#050515"],
    stageColors: ["#080820", "#000010"],
    ground: "rgba(199,125,255,0.1)",
  },
  {
    level: 11,
    name: "Magic Castle",
    emoji: "🏰",
    colors: ["#2d1a00", "#5a3a00", "#1a0f00"],
    stageColors: ["#4a2f00", "#2d1a00"],
    ground: "rgba(255,217,61,0.2)",
  },
];

function getWorld(level) {
  let world = WORLDS[0];
  for (const w of WORLDS) {
    if (level >= w.level) world = w;
  }
  return world;
}

// ── COMBOS ───────────────────────────────────────────────────
const COMBOS = [
  {
    pair: ["happy", "excited"],
    label: "DOUBLE JOY! 🎉",
    effect: "double",
    color: "#FFD93D",
    desc: "2× Score!",
  },
  {
    pair: ["brave", "angry"],
    label: "POWER UP! 🛡️",
    effect: "shield",
    color: "#4D96FF",
    desc: "Protected!",
  },
  {
    pair: ["silly", "happy"],
    label: "GIGGLE BOMB! 💣",
    effect: "slow",
    color: "#FF9A3C",
    desc: "+5 sec!",
  },
  {
    pair: ["sleepy", "shy"],
    label: "DREAM TIME! 💤",
    effect: "slow",
    color: "#C77DFF",
    desc: "Slow motion!",
  },
  {
    pair: ["scared", "brave"],
    label: "COURAGE! ⚡",
    effect: "bonus",
    color: "#6BCB77",
    desc: "Bonus round!",
  },
];

function checkCombo(lastTwo) {
  if (!lastTwo || lastTwo.length < 2) return null;
  const [a, b] = lastTwo;
  return (
    COMBOS.find(
      (c) =>
        (c.pair[0] === a && c.pair[1] === b) ||
        (c.pair[0] === b && c.pair[1] === a),
    ) || null
  );
}

export default function GameScreen({ navigation, route }) {
  const { mode = "classic" } = route.params || {};
  const insets = useSafeAreaInsets();

  // Core game state
  const [gamePhase, setGamePhase] = useState("idle");
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

  // World + combo state
  const [currentWorld, setCurrentWorld] = useState(WORLDS[0]);
  const [activeCombo, setActiveCombo] = useState(null);
  const [lives, setLives] = useState(3);
  const [shieldActive, setShieldActive] = useState(false);
  const [scoreMultiplier, setScoreMultiplier] = useState(1);
  const [comboPopLabel, setComboPopLabel] = useState(null);
  const worldAnim = useRef(new Animated.Value(0)).current;
  const comboAnim = useRef(new Animated.Value(0)).current;
  const shieldAnim = useRef(new Animated.Value(1)).current;

  // Speed timer
  const speedTimerRef = useRef(null);
  const [speedPct, setSpeedPct] = useState(1);

  // Pal animation
  const palScale = useRef(new Animated.Value(1)).current;
  const palRotate = useRef(new Animated.Value(0)).current;
  const palY = useRef(new Animated.Value(0)).current;

  // Refs for closures
  const seqRef = useRef([]);
  const playerIdxRef = useRef(0);
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const streakRef = useRef(0);
  const sessionEmosRef = useRef({});
  const gameActiveRef = useRef(false);
  const livesRef = useRef(3); // 3 lives per game
  const shieldRef = useRef(false);
  const multiplierRef = useRef(1);
  const lastTwoEmosRef = useRef([]);
  const speedTimeoutRef = useRef(null);

  useEffect(() => {
    loadSave().then(setSave);
    if (mode === "story") {
      setStoryLine(STORY_LINES[Math.floor(Math.random() * STORY_LINES.length)]);
    }
    return () => {
      clearSpeedTimer();
      if (speedTimeoutRef.current) clearTimeout(speedTimeoutRef.current);
    };
  }, []);

  const currentPal = save
    ? PALS.find((p) => p.id === save.selPal) || PALS[0]
    : PALS[0];

  // ── World transition ────────────────────────────────────
  function transitionToWorld(newLevel) {
    const newWorld = getWorld(newLevel);
    if (newWorld.level !== currentWorld.level) {
      Animated.sequence([
        Animated.timing(worldAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(worldAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
      setCurrentWorld(newWorld);
      showComboPopup(`${newWorld.emoji} ${newWorld.name}!`, newWorld.colors[1]);
    }
  }

  // ── Combo popup ─────────────────────────────────────────
  function showComboPopup(label, color = "#FFD93D") {
    setComboPopLabel({ label, color });
    comboAnim.setValue(0);
    Animated.sequence([
      Animated.spring(comboAnim, { toValue: 1, useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(comboAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setComboPopLabel(null));
  }

  // ── Pal animations ───────────────────────────────────────
  function animatePal(emoId) {
    palScale.setValue(1);
    palRotate.setValue(0);
    palY.setValue(0);
    const anims = {
      happy: () =>
        Animated.sequence([
          Animated.spring(palY, { toValue: -22, useNativeDriver: true }),
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
    const a = anims[emoId];
    if (a)
      a().start(() => {
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

  // ── Speed timer ──────────────────────────────────────────
  function startSpeedTimer() {
    if (mode !== "speed") return;
    setSpeedPct(1);
    const start = Date.now();
    speedTimerRef.current = setInterval(() => {
      const pct = Math.max(0, 1 - (Date.now() - start) / SPEED_TIME);
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

  // ── Game flow ─────────────────────────────────────────────
  async function startGame() {
    gameActiveRef.current = true;
    seqRef.current = [];
    playerIdxRef.current = 0;
    scoreRef.current = 0;
    levelRef.current = 1;
    streakRef.current = 0;
    sessionEmosRef.current = {};
    shieldRef.current = false;
    multiplierRef.current = 1;
    lastTwoEmosRef.current = [];
    livesRef.current = 3;
    setSequence([]);
    setPlayerIdx(0);
    setScore(0);
    setLevel(1);
    setStreak(0);
    setShieldActive(false);
    setScoreMultiplier(1);
    setLives(3);
    setCurrentWorld(getWorld(1));
    setGamePhase("showing");
    addToSequence([], 1);
  }

  async function addToSequence(currentSeq, currentLevel) {
    const next = Math.floor(Math.random() * EMOTIONS.length);

    // Cap sequence at 6 emotions max — beyond 6 is exhausting for kids
    // After cap, slide the window (drop oldest, add new) so it stays fresh
    const MAX_SEQ = 6;
    const rawSeq = [...currentSeq, next];
    const newSeq = rawSeq.length > MAX_SEQ ? rawSeq.slice(-MAX_SEQ) : rawSeq;

    seqRef.current = newSeq;
    setSequence(newSeq);
    playerIdxRef.current = 0;
    setPlayerIdx(0);
    setGamePhase("showing");
    setStageMsg("Watch carefully! 👀");

    // Gentler speed curve — never gets brutally fast
    // Level 1: 800ms delay, 500ms lit
    // Level 5: 550ms delay, 350ms lit
    // Level 10+: 400ms delay, 250ms lit (floor)
    const delay = Math.max(400, 800 - currentLevel * 35);
    const litDur = Math.max(250, 500 - currentLevel * 25);

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
    } else setStageMsg("Your turn! Show the feelings! 🎯");
  }

  // ── Player input ──────────────────────────────────────────
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
      // Shield absorbs one wrong answer
      if (shieldRef.current) {
        shieldRef.current = false;
        setShieldActive(false);
        Animated.sequence([
          Animated.timing(shieldAnim, {
            toValue: 1.4,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(shieldAnim, {
            toValue: 1.0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
        showComboPopup("🛡️ Shield Blocked It!", "#4D96FF");
        setStageMsg("Shield protected you! Try again! 🛡️");
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      animateWrong();
      handleWrong();
    }
  }

  function handleCorrect(emoId, idx, seq) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Track last two emotions for combo detection
    const newLastTwo = [...lastTwoEmosRef.current, emoId].slice(-2);
    lastTwoEmosRef.current = newLastTwo;

    // Check for combo
    const combo = checkCombo(newLastTwo);
    if (combo) {
      applyCombo(combo);
      lastTwoEmosRef.current = []; // reset after combo
    }

    streakRef.current += 1;
    const baseGain = 10 + (streakRef.current > 2 ? streakRef.current * 3 : 0);
    const gain = Math.round(baseGain * multiplierRef.current);
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

      // Determine if this round triggers a level up
      // Level up every 3 COMPLETED rounds, not based on seq length
      const completedRounds = seqRef.current.length; // grows by 1 each round
      const isLevelUp = completedRounds % 3 === 0;

      if (isLevelUp) {
        levelRef.current += 1;
        setLevel(levelRef.current);
        transitionToWorld(levelRef.current);
        setStageMsg(`${getWorld(levelRef.current).emoji} Level Up! New World!`);
      } else {
        const msgs = [
          "Fantastic! 🌟",
          "You got it! 💥",
          "Perfect! 🎯",
          "Amazing! ✨",
        ];
        setStageMsg(msgs[Math.floor(Math.random() * msgs.length)]);
      }

      // Reset multiplier after each round (keep shield)
      multiplierRef.current = 1;
      setScoreMultiplier(1);

      // Wait longer on level up so player can see + celebrate the message
      // Regular round: 1200ms pause, Level up: 2500ms pause
      const pauseDur = isLevelUp ? 2500 : 1200;

      // Keep showing pal stage but disable input during pause
      // (gamePhase stays 'showing' so buttons are already disabled)
      setTimeout(() => {
        if (!gameActiveRef.current) return;
        const nextSeq = [
          ...seqRef.current,
          Math.floor(Math.random() * EMOTIONS.length),
        ];
        addToSequence(nextSeq, levelRef.current);
      }, pauseDur);
    }
  }

  function applyCombo(combo) {
    showComboPopup(combo.label, combo.color);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    switch (combo.effect) {
      case "double":
        multiplierRef.current = 2;
        setScoreMultiplier(2);
        break;
      case "shield":
        shieldRef.current = true;
        setShieldActive(true);
        Animated.loop(
          Animated.sequence([
            Animated.timing(shieldAnim, {
              toValue: 1.15,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(shieldAnim, {
              toValue: 1.0,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
          { iterations: 5 },
        ).start();
        break;
      case "slow":
        // Slow the next sequence display
        break;
      case "bonus":
        scoreRef.current += 50;
        setScore(scoreRef.current);
        break;
    }
  }

  async function handleWrong() {
    if (!gameActiveRef.current) return;

    livesRef.current -= 1;
    setLives(livesRef.current);

    if (livesRef.current > 0) {
      // Still have a life — replay the sequence so player can try again
      streakRef.current = 0;
      setStreak(0);
      multiplierRef.current = 1;
      setScoreMultiplier(1);
      lastTwoEmosRef.current = [];

      // Show heart lost popup
      showComboPopup(
        lives <= 1 ? "💔 Last Heart!" : `💔 ${livesRef.current} Hearts Left`,
        "#FF6B6B",
      );
      setStageMsg("Oops! Watch again carefully... 👀");
      setGamePhase("showing");

      // Brief pause so player sees the mistake, then replay
      await sleep(1200);
      if (!gameActiveRef.current) return;

      // Replay the SAME sequence — don't add a new emotion
      const currentSeq = seqRef.current;
      playerIdxRef.current = 0;
      setPlayerIdx(0);
      setStageMsg("Watch carefully! 👀");

      const delay = Math.max(400, 800 - levelRef.current * 35);
      const litDur = Math.max(250, 500 - levelRef.current * 25);

      for (let i = 0; i < currentSeq.length; i++) {
        await sleep(delay);
        if (!gameActiveRef.current) return;
        const displayIdx =
          mode === "mirror"
            ? currentSeq[currentSeq.length - 1 - i]
            : currentSeq[i];
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
      } else setStageMsg("Try again! You can do it! 💪");
    } else {
      // No lives left — game over
      gameActiveRef.current = false;
      setGamePhase("gameover");
      setStageMsg("Nice effort! Keep practicing! 💪");

      const finalSave = await recordGameEnd(
        scoreRef.current,
        levelRef.current,
        streakRef.current,
        sessionEmosRef.current,
      );
      setSave(finalSave);
    }
  }

  function quitGame() {
    gameActiveRef.current = false;
    clearSpeedTimer();
    navigation.goBack();
  }

  function restartGame() {
    startGame();
  }

  // ── Computed values ───────────────────────────────────────
  const palRotateDeg = palRotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-360deg", "360deg"],
  });
  const speedColor =
    speedPct > 0.5 ? colors.green : speedPct > 0.25 ? colors.gold : colors.red;
  const world = currentWorld;
  const isLightWorld = world.level === 1; // light text vs dark text
  const textColor = isLightWorld ? colors.dark : "white";
  const textColorDim = isLightWorld ? colors.mid : "rgba(255,255,255,0.65)";

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

  // ── GAME OVER ─────────────────────────────────────────────
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
      <View style={s.root}>
        <LinearGradient
          colors={["#c9e8ff", "#e8f4fd", "#d4f0e0"]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView
          style={[s.overSafe, { paddingTop: insets.top }]}
          edges={["left", "right", "bottom"]}
        >
          <View style={s.overCard}>
            <Text style={s.overMedal}>{medal}</Text>
            <Text style={s.overTitle}>{title}</Text>
            <Text style={s.overSub}>{sub}</Text>
            <View style={[s.worldBadge, { backgroundColor: world.colors[1] }]}>
              <Text style={s.worldBadgeTxt}>
                {world.emoji} Reached: {world.name}
              </Text>
            </View>
            <View style={s.overStats}>
              {[
                { v: score, l: "Score" },
                { v: level, l: "Level" },
                { v: save?.best || 0, l: "Best" },
              ].map((st) => (
                <View key={st.l} style={s.ostat}>
                  <Text style={s.ostatV}>{st.v}</Text>
                  <Text style={s.ostatL}>{st.l}</Text>
                </View>
              ))}
            </View>
            {Object.keys(sessionEmosRef.current).length > 0 && (
              <View style={s.eosRow}>
                <Text style={s.eosTitle}>Feelings you showed:</Text>
                <View style={s.eosTags}>
                  {Object.keys(sessionEmosRef.current).map((eid) => {
                    const e = EMOTIONS.find((x) => x.id === eid);
                    return e ? (
                      <View
                        key={eid}
                        style={[s.eosTag, { backgroundColor: e.color }]}
                      >
                        <Text style={s.eosTagTxt}>
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
              onPress={restartGame}
              variant="green"
              style={{ marginBottom: 10 }}
            />
            <Button label="Back Home" onPress={quitGame} variant="soft" />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── MAIN GAME ─────────────────────────────────────────────
  return (
    <View style={s.root}>
      <StatusBar
        barStyle={isLightWorld ? "dark-content" : "light-content"}
        translucent
        backgroundColor="transparent"
      />

      {/* World background */}
      <LinearGradient colors={world.colors} style={StyleSheet.absoluteFill} />

      {/* World stars for dark worlds */}
      {!isLightWorld && (
        <View style={s.starsWrap} pointerEvents="none">
          {[...Array(30)].map((_, i) => (
            <View
              key={i}
              style={[
                s.star,
                {
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  width: Math.random() * 3 + 1,
                  height: Math.random() * 3 + 1,
                  opacity: 0.3 + Math.random() * 0.5,
                },
              ]}
            />
          ))}
        </View>
      )}

      <SafeAreaView style={s.safe} edges={["left", "right", "bottom"]}>
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingTop: insets.top + 12 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* HUD */}
          <View style={s.hud}>
            <BackButton onPress={quitGame} />
            <View style={s.hudPills}>
              <Pill value={score} label="Score" />
              <Pill value={level} label="Level" />
              <Pill value={streakLabel} label="Streak" />
            </View>
            <View style={s.livesWrap}>
              {[...Array(2)].map((_, i) => (
                <Text
                  key={i}
                  style={[s.lifeIcon, i >= lives && s.lifeIconLost]}
                >
                  ❤️
                </Text>
              ))}
            </View>
          </View>

          {/* World name banner */}
          <View style={[s.worldBanner, { backgroundColor: "rgba(0,0,0,0.2)" }]}>
            <Text style={s.worldBannerTxt}>
              {world.emoji} {world.name}
            </Text>
            {scoreMultiplier > 1 && (
              <View style={s.multiBadge}>
                <Text style={s.multiBadgeTxt}>{scoreMultiplier}× SCORE!</Text>
              </View>
            )}
            {shieldActive && (
              <Animated.View
                style={[s.shieldBadge, { transform: [{ scale: shieldAnim }] }]}
              >
                <Text style={s.shieldBadgeTxt}>🛡️ Shield</Text>
              </Animated.View>
            )}
          </View>

          {/* Combo hint strip */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.comboStrip}
          >
            {COMBOS.map((c, i) => (
              <View
                key={i}
                style={[s.comboHint, { borderColor: c.color + "80" }]}
              >
                <Text style={s.comboHintEmos}>
                  {EMOTIONS.find((e) => e.id === c.pair[0])?.icon}
                  {EMOTIONS.find((e) => e.id === c.pair[1])?.icon}
                </Text>
                <Text style={[s.comboHintLabel, { color: c.color }]}>
                  {c.desc}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Story bubble */}
          {mode === "story" && storyLine && (
            <View
              style={[
                s.storyBubble,
                { backgroundColor: "rgba(255,255,255,0.15)" },
              ]}
            >
              <Text style={s.storyPal}>
                {(PALS.find((p) => p.id === storyLine.pal) || PALS[0]).emoji}
              </Text>
              <View style={s.storyText}>
                <Text
                  style={[
                    s.storyName,
                    { color: isLightWorld ? colors.blue : "#74c0fc" },
                  ]}
                >
                  {storyLine.pal}
                </Text>
                <Text style={[s.storyLine, { color: textColor }]}>
                  {storyLine.text}
                </Text>
              </View>
            </View>
          )}

          {/* Speed bar */}
          {mode === "speed" && gamePhase === "player" && (
            <View style={s.speedBar}>
              <View
                style={[
                  s.speedFill,
                  { width: `${speedPct * 100}%`, backgroundColor: speedColor },
                ]}
              />
            </View>
          )}

          {/* Pal Stage */}
          <LinearGradient colors={world.stageColors} style={s.stage}>
            <View
              style={[
                s.emoLabelWrap,
                {
                  backgroundColor: currentEmo?.color || "rgba(255,255,255,0.2)",
                },
              ]}
            >
              <Text style={s.emoLabelText}>
                {currentEmo ? `${currentEmo.icon} ${currentEmo.label}` : "?"}
              </Text>
            </View>
            <Animated.Text
              style={[
                s.stagePal,
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
            <Text style={[s.stageMsg, { color: "rgba(255,255,255,0.8)" }]}>
              {stageMsg}
            </Text>
          </LinearGradient>

          {/* Sequence dots */}
          <View style={s.seqRow}>
            {sequence.map((idx, i) => (
              <View
                key={i}
                style={[
                  s.seqDot,
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
          <View style={s.levelRow}>
            <View style={s.lvlBadge}>
              <Text style={s.lvlBadgeTxt}>Level {level}</Text>
            </View>
            <View style={s.lvlTrack}>
              <View
                style={[
                  s.lvlFill,
                  {
                    width: `${((sequence.length % 3) / 3) * 100}%`,
                    backgroundColor:
                      world.level === 1 ? colors.green : colors.gold,
                  },
                ]}
              />
            </View>
          </View>

          {/* Emotion grid */}
          <View style={s.emoGrid}>
            {EMOTIONS.map((e) => {
              const isLit = litBtn === e.id;
              return (
                <TouchableOpacity
                  key={e.id}
                  style={[
                    s.emoBtn,
                    {
                      backgroundColor: isLightWorld
                        ? "white"
                        : "rgba(255,255,255,0.12)",
                    },
                    isLit && {
                      backgroundColor: e.color,
                      borderColor: e.color,
                      transform: [{ scale: 1.08 }],
                    },
                    gamePhase !== "player" && s.emoBtnDisabled,
                  ]}
                  onPress={() => handleEmoPress(e.id)}
                  disabled={gamePhase !== "player"}
                  activeOpacity={0.8}
                >
                  <Text style={s.emoBtnIcon}>{e.icon}</Text>
                  <Text
                    style={[
                      s.emoBtnLabel,
                      {
                        color: isLit
                          ? "white"
                          : isLightWorld
                            ? colors.mid
                            : "rgba(255,255,255,0.7)",
                      },
                    ]}
                  >
                    {e.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {gamePhase === "idle" && (
            <Button
              label="▶ Start!"
              onPress={startGame}
              variant="green"
              style={s.startBtn}
            />
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Combo popup overlay */}
      {comboPopLabel && (
        <Animated.View
          style={[
            s.comboPop,
            {
              backgroundColor: comboPopLabel.color,
              transform: [
                {
                  scale: comboAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                },
                {
                  translateY: comboAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [80, 0],
                  }),
                },
              ],
              opacity: comboAnim,
            },
          ]}
          pointerEvents="none"
        >
          <Text style={s.comboPopTxt}>{comboPopLabel.label}</Text>
        </Animated.View>
      )}
    </View>
  );
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: 40 },

  starsWrap: { position: "absolute", inset: 0 },
  star: { position: "absolute", borderRadius: 99, backgroundColor: "white" },

  hud: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  livesWrap: { flexDirection: "row", gap: 2 },
  lifeIcon: { fontSize: 18 },
  lifeIconLost: { opacity: 0.2 },
  hudPills: { flexDirection: "row", gap: 8 },

  worldBanner: {
    borderRadius: radius.lg,
    paddingVertical: 6,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.sm,
  },
  worldBannerTxt: {
    fontFamily: fonts.display,
    fontSize: 14,
    color: "white",
    fontWeight: "800",
    flex: 1,
  },
  multiBadge: {
    backgroundColor: "#FFD93D",
    borderRadius: 50,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  multiBadgeTxt: {
    fontFamily: fonts.display,
    fontSize: 11,
    color: "#1e2d3d",
    fontWeight: "900",
  },
  shieldBadge: {
    backgroundColor: "#4D96FF",
    borderRadius: 50,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  shieldBadgeTxt: {
    fontFamily: fonts.display,
    fontSize: 11,
    color: "white",
    fontWeight: "900",
  },

  comboStrip: { marginBottom: spacing.sm },
  comboHint: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: radius.md,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  comboHintEmos: { fontSize: 16 },
  comboHintLabel: {
    fontFamily: fonts.body,
    fontSize: 9,
    fontWeight: "800",
    marginTop: 2,
  },

  storyBubble: {
    flexDirection: "row",
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 12,
  },
  storyPal: { fontSize: 44 },
  storyText: { flex: 1 },
  storyName: { fontFamily: fonts.display, fontSize: 13, marginBottom: 3 },
  storyLine: { fontFamily: fonts.body, fontSize: 13, lineHeight: 20 },

  speedBar: {
    height: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
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
    ...shadows.lg,
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
  stageMsg: { fontFamily: fonts.body, fontSize: 14, textAlign: "center" },

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
    backgroundColor: "rgba(255,255,255,0.3)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },

  levelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: spacing.md,
  },
  lvlBadge: {
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: radius.full,
    paddingVertical: 3,
    paddingHorizontal: 12,
  },
  lvlBadgeTxt: { fontFamily: fonts.display, fontSize: 13, color: "white" },
  lvlTrack: {
    flex: 1,
    height: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    overflow: "hidden",
  },
  lvlFill: { height: 10, borderRadius: 8 },

  emoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: spacing.md,
  },
  emoBtn: {
    width: "22%",
    flexGrow: 1,
    borderRadius: radius.lg,
    padding: 10,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    ...shadows.sm,
  },
  emoBtnDisabled: { opacity: 0.55 },
  emoBtnIcon: { fontSize: 26, marginBottom: 3 },
  emoBtnLabel: {
    fontFamily: fonts.body,
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  startBtn: { marginTop: 8 },

  livesRow: { flexDirection: "row", gap: 3, alignItems: "center" },
  heart: { fontSize: 18 },
  heartEmpty: { opacity: 0.35 },

  comboPop: {
    position: "absolute",
    bottom: 120,
    alignSelf: "center",
    borderRadius: radius.xl,
    paddingVertical: 14,
    paddingHorizontal: 28,
    ...shadows.lg,
  },
  comboPopTxt: {
    fontFamily: fonts.displayBold,
    fontSize: 24,
    color: "white",
    fontWeight: "900",
  },

  // Game over
  overSafe: { flex: 1, justifyContent: "center", padding: spacing.lg },
  overCard: {
    backgroundColor: "white",
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
    marginBottom: 12,
    textAlign: "center",
    lineHeight: 20,
  },
  worldBadge: {
    borderRadius: radius.lg,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  worldBadgeTxt: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: "white",
    fontWeight: "800",
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
