// src/screens/GameScreen.js — clean stable game loop
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, ScrollView, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { EMOTIONS, PALS, STORY_LINES } from '../data/gameData';
import { loadSave, recordGameEnd } from '../hooks/useStorage';
import { colors, fonts, radius, shadows, spacing } from '../utils/theme';
import { Button, BackButton, Pill } from '../components/UI';

// ── Constants ────────────────────────────────────────────────
const SPEED_TIME    = 4000;
const FREE_LEVEL_CAP = 10;
const MAX_SEQ_LEN   = 6;

const WORLDS = [
  { level:1,  name:'Sunny Meadow',    emoji:'🌸', colors:['#d4f0e0','#e8ffd0','#c9e8ff'], stageColors:['#e8ffd0','#d4f7ea'] },
  { level:3,  name:'Twilight Forest', emoji:'🌙', colors:['#2d1b4e','#4a2d7a','#1a3a5c'], stageColors:['#3d2060','#2d1b4e'] },
  { level:5,  name:'Starry Night',    emoji:'✨', colors:['#0a0a2e','#1a1a4e','#0d1b3e'], stageColors:['#12124a','#0a0a2e'] },
  { level:7,  name:'Volcano Island',  emoji:'🌋', colors:['#3d0a00','#7a1a00','#2d0500'], stageColors:['#5a0f00','#3d0a00'] },
  { level:9,  name:'Galaxy Space',    emoji:'🌌', colors:['#000010','#0a0a1e','#050515'], stageColors:['#080820','#000010'] },
  { level:11, name:'Magic Castle',    emoji:'🏰', colors:['#2d1a00','#5a3a00','#1a0f00'], stageColors:['#4a2f00','#2d1a00'] },
];

const COMBOS = [
  { pair:['happy','excited'],  label:'DOUBLE JOY! 🎉',  effect:'double', color:'#FFD93D' },
  { pair:['brave','angry'],    label:'POWER UP! 🛡️',    effect:'shield', color:'#4D96FF' },
  { pair:['silly','happy'],    label:'GIGGLE BOMB! 💣', effect:'slow',   color:'#FF9A3C' },
  { pair:['sleepy','shy'],     label:'DREAM TIME! 💤',  effect:'slow',   color:'#C77DFF' },
  { pair:['scared','brave'],   label:'COURAGE! ⚡',     effect:'bonus',  color:'#6BCB77' },
];

const COMBO_HINTS = [
  { emos:'😄🤩', desc:'2× Score',    color:'#FFD93D' },
  { emos:'💪😤', desc:'Shield',      color:'#4D96FF' },
  { emos:'🤪😄', desc:'+Time',       color:'#FF9A3C' },
  { emos:'😴😊', desc:'Slow-mo',     color:'#C77DFF' },
  { emos:'😱💪', desc:'+50pts',      color:'#6BCB77' },
];

const STARS = Array.from({ length: 25 }, (_, i) => ({
  top:  `${(i * 37.3 + 7) % 100}%`,
  left: `${(i * 61.8 + 13) % 100}%`,
  size: (i % 3) + 1,
  opacity: 0.3 + (i % 5) * 0.1,
}));

function getWorld(level) {
  let w = WORLDS[0];
  for (const world of WORLDS) { if (level >= world.level) w = world; }
  return w;
}

function checkCombo(a, b) {
  return COMBOS.find(c =>
    (c.pair[0]===a && c.pair[1]===b) || (c.pair[0]===b && c.pair[1]===a)
  ) || null;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Component ────────────────────────────────────────────────
export default function GameScreen({ navigation, route }) {
  const rawMode = route?.params?.mode || 'classic';
  const mode    = ['classic','speed','mirror','story'].includes(rawMode) ? rawMode : 'classic';
  const insets  = useSafeAreaInsets();

  // ── State ─────────────────────────────────────────────────
  const [save,            setSave]           = useState(null);
  const [gamePhase,       setGamePhase]      = useState('idle');
  const [displaySeq,      setDisplaySeq]     = useState([]);
  const [score,           setScore]          = useState(0);
  const [level,           setLevel]          = useState(1);
  const [streak,          setStreak]         = useState(0);
  const [litBtn,          setLitBtn]         = useState(null);
  const [currentEmo,      setCurrentEmo]     = useState(null);
  const [stageMsg,        setStageMsg]       = useState('Press Start!');
  const [storyLine,       setStoryLine]      = useState(null);
  const [currentWorld,    setCurrentWorld]   = useState(WORLDS[0]);
  const [shieldActive,    setShieldActive]   = useState(false);
  const [scoreMultiplier, setScoreMultiplier]= useState(1);
  const [comboPopLabel,   setComboPopLabel]  = useState(null);
  const [speedPct,        setSpeedPct]       = useState(1);
  const [tapsLeft,        setTapsLeft]       = useState(0); // how many taps left in round
  const [storyIdx,        setStoryIdx]       = useState(0);
  const [storyResult,     setStoryResult]    = useState(null); // 'correct' | 'wrong' | null
  const [storiesAnswered, setStoriesAnswered]= useState(0);
  const storyOrderRef = useRef([]);

  // ── Refs — single source of truth for game logic ──────────
  const gameActive    = useRef(false);
  const seqRef        = useRef([]);      // the full sequence to show/echo
  const tapIndexRef   = useRef(0);       // which tap the player is on (0-based)
  const seqLenRef     = useRef(0);       // length of current sequence (frozen at round start)
  const scoreRef      = useRef(0);
  const levelRef      = useRef(1);
  const streakRef     = useRef(0);
  const roundsRef     = useRef(0);
  const sessionEmos   = useRef({});
  const shieldRef     = useRef(false);
  const multiplierRef = useRef(1);
  const lastTwoRef    = useRef([]);
  const speedTimer    = useRef(null);
  const comboAnim     = useRef(new Animated.Value(0)).current;
  const shieldAnim    = useRef(new Animated.Value(1)).current;
  const palScale      = useRef(new Animated.Value(1)).current;
  const palRotate     = useRef(new Animated.Value(0)).current;
  const palY          = useRef(new Animated.Value(0)).current;

  // ── clearSpeedTimer — defined before useEffect ────────────
  const clearSpeedTimer = useCallback(() => {
    if (speedTimer.current) { clearInterval(speedTimer.current); speedTimer.current = null; }
  }, []);

  useEffect(() => {
    loadSave().then(d => {
      setSave(d);
      if (mode === 'story') {
        setStoryLine(STORY_LINES[Math.floor(Math.random() * STORY_LINES.length)]);
      }
    });
    return () => clearSpeedTimer();
  }, []);

  const currentPal = save ? (PALS.find(p => p.id === save.selPal) || PALS[0]) : PALS[0];
  const isPremium  = save?.isPremium === true;

  // ── Animations ────────────────────────────────────────────
  function showComboPopup(label, color) {
    setComboPopLabel({ label, color });
    comboAnim.setValue(0);
    Animated.sequence([
      Animated.spring(comboAnim, { toValue:1, useNativeDriver:true }),
      Animated.delay(1200),
      Animated.timing(comboAnim, { toValue:0, duration:300, useNativeDriver:true }),
    ]).start(() => setComboPopLabel(null));
  }

  function animatePal(emoId) {
    palScale.setValue(1); palRotate.setValue(0); palY.setValue(0);
    const a = {
      happy:   () => Animated.sequence([Animated.spring(palY,{toValue:-20,useNativeDriver:true}),Animated.spring(palY,{toValue:0,useNativeDriver:true})]),
      silly:   () => Animated.sequence([Animated.timing(palRotate,{toValue:-0.2,duration:120,useNativeDriver:true}),Animated.timing(palRotate,{toValue:0.2,duration:120,useNativeDriver:true}),Animated.timing(palRotate,{toValue:0,duration:120,useNativeDriver:true})]),
      brave:   () => Animated.sequence([Animated.spring(palScale,{toValue:1.3,useNativeDriver:true}),Animated.spring(palScale,{toValue:1,useNativeDriver:true})]),
      shy:     () => Animated.sequence([Animated.spring(palScale,{toValue:0.75,useNativeDriver:true}),Animated.spring(palScale,{toValue:0.9,useNativeDriver:true})]),
      sleepy:  () => Animated.timing(palY,{toValue:8,duration:400,useNativeDriver:true}),
      angry:   () => Animated.sequence([Animated.timing(palRotate,{toValue:-0.12,duration:70,useNativeDriver:true}),Animated.timing(palRotate,{toValue:0.12,duration:70,useNativeDriver:true}),Animated.timing(palRotate,{toValue:0,duration:70,useNativeDriver:true})]),
      excited: () => Animated.sequence([Animated.spring(palScale,{toValue:1.25,useNativeDriver:true}),Animated.spring(palScale,{toValue:1.1,useNativeDriver:true}),Animated.spring(palScale,{toValue:1,useNativeDriver:true})]),
      scared:  () => Animated.sequence([Animated.spring(palScale,{toValue:0.8,useNativeDriver:true}),Animated.spring(palScale,{toValue:0.95,useNativeDriver:true})]),
    }[emoId];
    if (a) a().start(() => { palScale.setValue(1); palRotate.setValue(0); palY.setValue(0); });
  }

  // ── Speed timer ───────────────────────────────────────────
  function startSpeedTimer() {
    if (mode !== 'speed') return;
    setSpeedPct(1);
    const start = Date.now();
    speedTimer.current = setInterval(() => {
      const pct = Math.max(0, 1 - (Date.now() - start) / SPEED_TIME);
      setSpeedPct(pct);
      if (pct <= 0) { clearSpeedTimer(); doWrong(); }
    }, 100);
  }

  // ── CORE: show a sequence then let player echo it ─────────
  async function playRound(seq, lvl) {
    if (!gameActive.current) return;

    // Freeze the sequence length NOW — this is what the player must echo
    const frozen = [...seq];
    seqRef.current   = frozen;
    seqLenRef.current = frozen.length;
    tapIndexRef.current = 0;

    setDisplaySeq(frozen);
    setGamePhase('showing');
    setStageMsg('Watch carefully! 👀');
    setLitBtn(null);
    setCurrentEmo(null);

    const delay  = Math.max(400, 800 - lvl * 35);
    const litDur = Math.max(250, 500 - lvl * 25);

    // Show the sequence
    for (let i = 0; i < frozen.length; i++) {
      await sleep(delay);
      if (!gameActive.current) return;

      const displayIdx = mode === 'mirror'
        ? frozen[frozen.length - 1 - i]
        : frozen[i];
      const emo = EMOTIONS[displayIdx];
      if (!emo) continue;

      setLitBtn(emo.id);
      setCurrentEmo(emo);
      animatePal(emo.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      await sleep(litDur);
      setLitBtn(null);
    }

    await sleep(400);
    if (!gameActive.current) return;

    setCurrentEmo(null);
    setTapsLeft(frozen.length);
    setGamePhase('player');

    if (mode === 'speed') {
      setStageMsg(`Show all ${frozen.length} feelings! ⚡`);
      startSpeedTimer();
    } else {
      setStageMsg(`Show all ${frozen.length} feelings! 🎯`);
    }
  }

  // ── Start game ────────────────────────────────────────────
  async function startGame() {
    gameActive.current    = true;
    scoreRef.current      = 0;
    levelRef.current      = 1;
    streakRef.current     = 0;
    roundsRef.current     = 0;
    sessionEmos.current   = {};
    shieldRef.current     = false;
    multiplierRef.current = 1;
    lastTwoRef.current    = [];

    setScore(0); setLevel(1); setStreak(0);
    setShieldActive(false); setScoreMultiplier(1);
    setCurrentWorld(WORLDS[0]);
    setStoryResult(null);
    setStoriesAnswered(0);

    if (mode === 'story') {
      // Shuffle story order
      const indices = STORY_LINES.map((_, i) => i).sort(() => Math.random() - 0.5);
      storyOrderRef.current = indices;
      setStoryIdx(0);
      setStageMsg('How does your Pal feel?');
      setGamePhase('player');
    } else {
      const firstSeq = [Math.floor(Math.random() * EMOTIONS.length)];
      await playRound(firstSeq, 1);
    }
  }

  // ── Story mode tap ───────────────────────────────────────
  function handleStoryTap(emoId) {
    if (gamePhase !== 'player') return;
    if (storyResult) return; // already answered

    const storyIndex = storyOrderRef.current[storyIdx % storyOrderRef.current.length];
    const story      = STORY_LINES[storyIndex];
    if (!story) return;

    if (emoId === story.answer) {
      // Correct!
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      streakRef.current += 1;
      const gain = 20 + streakRef.current * 5;
      scoreRef.current += gain;
      setScore(scoreRef.current);
      setStreak(streakRef.current);
      sessionEmos.current[emoId] = (sessionEmos.current[emoId] || 0) + 1;

      const newAnswered = storiesAnswered + 1;
      setStoriesAnswered(newAnswered);
      setStoryResult('correct');
      setStageMsg('You got it! 🌟');

      // Level up every 4 correct stories
      if (newAnswered % 4 === 0) {
        const nextLevel = levelRef.current + 1;
        levelRef.current = nextLevel;
        setLevel(nextLevel);
        const newWorld = getWorld(nextLevel);
        setCurrentWorld(newWorld);
        showComboPopup(`${newWorld.emoji} Level ${nextLevel}!`, newWorld.colors[1] || '#4D96FF');
      }

      // Next story after pause
      setTimeout(() => {
        if (!gameActive.current) return;
        setStoryResult(null);
        setStoryIdx(prev => prev + 1);
        setStageMsg('How does your Pal feel?');
        setGamePhase('player');
      }, 1500);

    } else {
      // Wrong — show hint, let them try again
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      streakRef.current = 0;
      setStreak(0);
      setStoryResult('wrong');
      setStageMsg(story.hint || 'Think about how that would feel...');

      setTimeout(() => {
        if (!gameActive.current) return;
        setStoryResult(null);
        setStageMsg('How does your Pal feel?');
      }, 2000);
    }
  }

  // ── Player taps a button ──────────────────────────────────
  function handleEmoPress(emoId) {
    if (gamePhase !== 'player') return;
    if (!gameActive.current) return;
    clearSpeedTimer();

    const tapIdx   = tapIndexRef.current;
    const seq      = seqRef.current;
    const seqLen   = seqLenRef.current;

    if (tapIdx >= seqLen) return; // safety

    const expectedIdx = mode === 'mirror'
      ? seq[seqLen - 1 - tapIdx]
      : seq[tapIdx];

    const expected = EMOTIONS[expectedIdx]?.id;
    if (!expected) return;

    if (emoId === expected) {
      onCorrectTap(emoId, tapIdx, seqLen);
    } else {
      if (shieldRef.current) {
        shieldRef.current = false;
        setShieldActive(false);
        showComboPopup('🛡️ Shield Blocked It!', '#4D96FF');
        setStageMsg('Shield saved you! Try again! 🛡️');
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      onWrongTap();
    }
  }

  // ── Correct tap ───────────────────────────────────────────
  function onCorrectTap(emoId, tapIdx, seqLen) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    // Combo check
    const prev = lastTwoRef.current;
    const newTwo = [...prev, emoId].slice(-2);
    lastTwoRef.current = newTwo;
    if (newTwo.length === 2) {
      const combo = checkCombo(newTwo[0], newTwo[1]);
      if (combo) {
        applyCombo(combo);
        lastTwoRef.current = [];
      }
    }

    // Score
    streakRef.current += 1;
    const gain = Math.round(
      (10 + (streakRef.current > 2 ? streakRef.current * 2 : 0)) * multiplierRef.current
    );
    scoreRef.current += gain;
    setScore(scoreRef.current);
    setStreak(streakRef.current);

    // Track emotion
    sessionEmos.current[emoId] = (sessionEmos.current[emoId] || 0) + 1;

    const nextTap = tapIdx + 1;
    tapIndexRef.current = nextTap;
    setTapsLeft(seqLen - nextTap);

    if (nextTap >= seqLen) {
      // ── Round complete ──────────────────────────────────
      onRoundComplete();
    }
  }

  // ── Round complete — purely synchronous, schedules next round ──
  function onRoundComplete() {
    // Bonus points for finishing round
    scoreRef.current += levelRef.current * 5;
    setScore(scoreRef.current);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    roundsRef.current += 1;
    const rounds = roundsRef.current;

    // Level up every 3 rounds
    if (rounds % 3 === 0) {
      const nextLevel = levelRef.current + 1;

      // Free level cap
      if (!isPremium && nextLevel > FREE_LEVEL_CAP) {
        gameActive.current = false;
        setGamePhase('levelcap');
        recordGameEnd(scoreRef.current, levelRef.current, streakRef.current, sessionEmos.current)
          .then(s => setSave(s)).catch(() => {});
        return;
      }

      levelRef.current = nextLevel;
      setLevel(nextLevel);
      const newWorld = getWorld(nextLevel);
      setCurrentWorld(newWorld);
      setStageMsg(`${newWorld.emoji} Level ${nextLevel}! New World!`);
      showComboPopup(`${newWorld.emoji} Level Up!`, newWorld.colors[1] || '#4D96FF');
    } else {
      const msgs = ['Fantastic! 🌟', 'You got it! 💥', 'Perfect! 🎯', 'Amazing! ✨', 'Brilliant! 🔥'];
      setStageMsg(msgs[rounds % msgs.length]);
    }

    multiplierRef.current = 1;
    setScoreMultiplier(1);
    setGamePhase('between'); // freeze buttons between rounds

    // Schedule next round with a plain setTimeout
    const pause = (rounds % 3 === 0) ? 2000 : 1000;
    setTimeout(() => {
      if (!gameActive.current) return;
      // Add one new emotion to sequence, cap at MAX_SEQ_LEN
      const current = seqRef.current;
      const next    = Math.floor(Math.random() * EMOTIONS.length);
      const raw     = [...current, next];
      const newSeq  = raw.length > MAX_SEQ_LEN ? raw.slice(-MAX_SEQ_LEN) : raw;
      playRound(newSeq, levelRef.current);
    }, pause);
  }

  // ── Wrong tap — replay same sequence ─────────────────────
  function onWrongTap() {
    if (!gameActive.current) return;

    streakRef.current = 0;
    setStreak(0);
    multiplierRef.current = 1;
    setScoreMultiplier(1);
    lastTwoRef.current = [];

    const msgs = [
      { label:'Almost! Watch again 👀', color:'#FF9A3C' },
      { label:'So close! Try again 💪', color:'#4D96FF' },
      { label:'Watch carefully! 🧠',    color:'#C77DFF' },
      { label:'You got this! Keep going!', color:'#6BCB77' },
    ];
    const msg = msgs[Math.floor(Math.random() * msgs.length)];
    showComboPopup(msg.label, msg.color);
    setGamePhase('between');

    // Replay same sequence after short pause
    setTimeout(() => {
      if (!gameActive.current) return;
      playRound(seqRef.current, levelRef.current);
    }, 1000);
  }

  // ── Combos ────────────────────────────────────────────────
  function applyCombo(combo) {
    showComboPopup(combo.label, combo.color);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (combo.effect === 'double') {
      multiplierRef.current = 2; setScoreMultiplier(2);
    } else if (combo.effect === 'shield') {
      shieldRef.current = true; setShieldActive(true);
      Animated.loop(Animated.sequence([
        Animated.timing(shieldAnim,{toValue:1.15,duration:600,useNativeDriver:true}),
        Animated.timing(shieldAnim,{toValue:1.0, duration:600,useNativeDriver:true}),
      ]),{iterations:4}).start();
    } else if (combo.effect === 'bonus') {
      scoreRef.current += 50; setScore(scoreRef.current);
    }
  }

  // ── Quit ──────────────────────────────────────────────────
  function quitGame() {
    gameActive.current = false;
    clearSpeedTimer();
    if (scoreRef.current > 0) {
      recordGameEnd(scoreRef.current, levelRef.current, streakRef.current, sessionEmos.current)
        .then(s => { setSave(s); setGamePhase('gameover'); })
        .catch(() => navigation.goBack());
    } else {
      navigation.goBack();
    }
  }

  function restartGame() { startGame(); }

  // ── Render helpers ────────────────────────────────────────
  const palRotateDeg = palRotate.interpolate({inputRange:[-1,1],outputRange:['-360deg','360deg']});
  const speedColor   = speedPct > 0.5 ? colors.green : speedPct > 0.25 ? colors.gold : colors.red;
  const world        = currentWorld;
  const isLight      = world.level === 1;
  const streakLabel  = streak >= 10 ? '👑' : streak >= 8 ? '⭐' : streak >= 5 ? '⚡' : streak >= 3 ? '🔥' : streak > 0 ? `${streak}×` : '—';

  // ── Loading ───────────────────────────────────────────────
  if (!save) {
    return (
      <View style={{flex:1,backgroundColor:'#0f1f43',justifyContent:'center',alignItems:'center'}}>
        <Text style={{fontSize:48}}>🐾</Text>
        <Text style={{color:'white',marginTop:12,fontSize:14}}>Loading...</Text>
      </View>
    );
  }

  // ── Level cap ─────────────────────────────────────────────
  if (gamePhase === 'levelcap') {
    return (
      <View style={s.root}>
        <LinearGradient colors={['#1a2a50','#2a3a70','#0f1f43']} style={StyleSheet.absoluteFill}/>
        <SafeAreaView style={{flex:1}} edges={['top','left','right','bottom']}>
          <ScrollView contentContainerStyle={{flexGrow:1,justifyContent:'center',padding:spacing.lg}}>
            <View style={s.overCard}>
              <Text style={{fontSize:64,marginBottom:8}}>🏆</Text>
              <Text style={[s.overTitle,{color:'#FFD93D'}]}>Level 10 Champion!</Text>
              <Text style={s.overSub}>You have mastered the free levels — you are an emotional memory superstar!</Text>
              <View style={s.overStats}>
                {[{v:score,l:'Score'},{v:level,l:'Level'},{v:save.best||0,l:'Best'}].map(st=>(
                  <View key={st.l} style={s.ostat}><Text style={s.ostatV}>{st.v}</Text><Text style={s.ostatL}>{st.l}</Text></View>
                ))}
              </View>
              <View style={s.capBox}>
                <Text style={s.capBoxTitle}>Keep Going with Premium 👑</Text>
                <Text style={s.capBoxSub}>Unlock all 9 Pals, unlimited levels and all game modes for a one-time $7.99.</Text>
              </View>
              <TouchableOpacity style={s.capCta} onPress={()=>navigation.navigate('Paywall',{})} activeOpacity={0.88}>
                <LinearGradient colors={['#FFD93D','#FF9A3C']} style={s.capCtaGrad} start={{x:0,y:0}} end={{x:1,y:0}}>
                  <Text style={s.capCtaTxt}>Unlock Premium — $7.99</Text>
                </LinearGradient>
              </TouchableOpacity>
              <Button label="Play Again (Free)" onPress={restartGame} variant="soft" style={{marginBottom:8}}/>
              <Button label="Back Home" onPress={()=>navigation.goBack()} variant="soft"/>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ── Game over ─────────────────────────────────────────────
  if (gamePhase === 'gameover') {
    const medal = score>=200?'🏆':score>=100?'🌟':score>=50?'🥳':currentPal.emoji;
    const title = score>=200?'Feelings Master!':score>=100?'Amazing Session!':score>=50?'Great Practice!':'Nice Session!';
    return (
      <View style={s.root}>
        <LinearGradient colors={['#c9e8ff','#e8f4fd','#d4f0e0']} style={StyleSheet.absoluteFill}/>
        <SafeAreaView style={{flex:1}} edges={['top','left','right','bottom']}>
          <ScrollView contentContainerStyle={{flexGrow:1,justifyContent:'center',padding:spacing.lg}}>
            <View style={s.overCard}>
              <Text style={{fontSize:64,marginBottom:8}}>{medal}</Text>
              <Text style={s.overTitle}>{title}</Text>
              <View style={[s.worldBadge,{backgroundColor:world.colors[1]||'#4D96FF'}]}>
                <Text style={s.worldBadgeTxt}>{world.emoji} {world.name}</Text>
              </View>
              <View style={s.overStats}>
                {[{v:score,l:'Score'},{v:level,l:'Level'},{v:save.best||0,l:'Best'}].map(st=>(
                  <View key={st.l} style={s.ostat}><Text style={s.ostatV}>{st.v}</Text><Text style={s.ostatL}>{st.l}</Text></View>
                ))}
              </View>
              <Button label="Play Again! 🎮" onPress={restartGame} variant="green" style={{marginBottom:10}}/>
              <Button label="Back Home" onPress={()=>navigation.goBack()} variant="soft"/>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ── Main game ─────────────────────────────────────────────
  const isPlayerTurn = gamePhase === 'player';

  return (
    <View style={s.root}>
      <StatusBar barStyle={isLight?'dark-content':'light-content'} translucent backgroundColor="transparent"/>
      <LinearGradient colors={world.colors} style={StyleSheet.absoluteFill}/>

      {!isLight && (
        <View style={s.starsWrap} pointerEvents="none">
          {STARS.map((st,i)=>(
            <View key={i} style={[s.star,{top:st.top,left:st.left,width:st.size,height:st.size,opacity:st.opacity}]}/>
          ))}
        </View>
      )}

      <SafeAreaView style={s.safe} edges={['left','right','bottom']}>
        <ScrollView contentContainerStyle={[s.scroll,{paddingTop:insets.top+12}]} showsVerticalScrollIndicator={false}>

          {/* HUD */}
          <View style={s.hud}>
            <BackButton onPress={quitGame}/>
            <View style={s.hudPills}>
              <Pill value={score}       label="Score"/>
              <Pill value={level}       label="Level"/>
              <Pill value={streakLabel} label="Streak"/>
            </View>
          </View>

          {/* World banner */}
          <View style={[s.worldBanner,{backgroundColor:'rgba(0,0,0,0.25)'}]}>
            <Text style={s.worldBannerTxt}>{world.emoji} {world.name}</Text>
            {scoreMultiplier>1 && <View style={s.multiBadge}><Text style={s.multiBadgeTxt}>{scoreMultiplier}× SCORE!</Text></View>}
            {shieldActive && <Animated.View style={[s.shieldBadge,{transform:[{scale:shieldAnim}]}]}><Text style={s.shieldBadgeTxt}>🛡️ Shield</Text></Animated.View>}
          </View>

          {/* Combo hints */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:spacing.sm}}>
            {COMBO_HINTS.map((c,i)=>(
              <View key={i} style={[s.comboHint,{borderColor:c.color+'80'}]}>
                <Text style={{fontSize:15}}>{c.emos}</Text>
                <Text style={[s.comboHintLabel,{color:c.color}]}>{c.desc}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Story mode card */}
          {mode === 'story' && (() => {
            const si    = storyOrderRef.current[storyIdx % Math.max(storyOrderRef.current.length, 1)];
            const story = STORY_LINES[si] || STORY_LINES[0];
            const pal   = PALS.find(p => p.id === story?.pal) || PALS[0];
            const bgColor = storyResult === 'correct' ? 'rgba(107,203,119,0.25)'
              : storyResult === 'wrong' ? 'rgba(255,107,107,0.25)'
              : 'rgba(255,255,255,0.15)';
            return (
              <View style={[s.storyCard, { backgroundColor: bgColor }]}>
                <View style={s.storyCardHeader}>
                  <Text style={s.storyPalEmoji}>{pal.emoji}</Text>
                  <View style={s.storyCardMeta}>
                    <Text style={s.storyPalName}>{pal.name} says...</Text>
                    <Text style={s.storyScore}>Story {storiesAnswered + 1}</Text>
                  </View>
                </View>
                <Text style={s.storyCardText}>{story?.text}</Text>
                {storyResult === 'correct' && (
                  <View style={s.storyResultBadge}>
                    <Text style={s.storyResultTxt}>✓ Correct! +{20 + streakRef.current * 5} pts</Text>
                  </View>
                )}
                {storyResult === 'wrong' && (
                  <View style={[s.storyResultBadge, { backgroundColor: 'rgba(255,107,107,0.3)' }]}>
                    <Text style={s.storyResultTxt}>💭 {story?.hint}</Text>
                  </View>
                )}
                {!storyResult && (
                  <Text style={s.storyPrompt}>👆 Tap the emotion that matches!</Text>
                )}
              </View>
            );
          })()}

          {/* Regular sequence dots — hide in story mode */}
          {mode !== 'story' && false && null}

          {/* Speed bar */}
          {mode==='speed' && isPlayerTurn && (
            <View style={s.speedBar}>
              <View style={[s.speedFill,{width:`${speedPct*100}%`,backgroundColor:speedColor}]}/>
            </View>
          )}

          {/* Pal stage */}
          <LinearGradient colors={world.stageColors} style={s.stage}>
            <View style={[s.emoLabel,{backgroundColor:currentEmo?.color||'rgba(255,255,255,0.2)'}]}>
              <Text style={s.emoLabelTxt}>{currentEmo?`${currentEmo.icon} ${currentEmo.label}`:'?'}</Text>
            </View>
            <Animated.Text style={[s.palEmoji,{transform:[{scale:palScale},{rotate:palRotateDeg},{translateY:palY}]}]}>
              {currentPal.emoji}
            </Animated.Text>
            <Text style={[s.stageMsg,{color:'rgba(255,255,255,0.9)'}]}>{stageMsg}</Text>
          </LinearGradient>

          {/* Sequence dots — hidden in story mode */}
          {mode !== 'story' && <View style={s.seqRow}>
            {displaySeq.map((idx, i) => (
              <View key={i} style={[
                s.seqDot,
                i < tapIndexRef.current && {backgroundColor:EMOTIONS[idx]?.color||'#aaa',opacity:0.4},
                i === tapIndexRef.current && isPlayerTurn && {backgroundColor:EMOTIONS[idx]?.color||'#aaa',transform:[{scale:1.35}]},
              ]}/>
            ))}
          </View>

          {/* Rounds to level up */}
          <View style={s.levelRow}>
            <View style={s.lvlBadge}><Text style={s.lvlBadgeTxt}>Level {level}</Text></View>
            <View style={s.lvlTrack}>
              <View style={[s.lvlFill,{
                width:`${((roundsRef.current % 3) / 3) * 100}%`,
                backgroundColor: isLight ? colors.green : colors.gold,
              }]}/>
            </View>
            <Text style={[s.roundHint,{color:isLight?colors.dim:'rgba(255,255,255,0.5)'}]}>
              {3 - (roundsRef.current % 3)} to level up
            </Text>
          </View>

          {/* Emotion buttons */}
          <View style={s.emoGrid}>
            {EMOTIONS.map(e => {
              const isLit = litBtn === e.id;
              return (
                <TouchableOpacity
                  key={e.id}
                  style={[
                    s.emoBtn,
                    {backgroundColor: isLight ? 'white' : 'rgba(255,255,255,0.12)'},
                    isLit && {backgroundColor:e.color,borderColor:e.color,transform:[{scale:1.08}]},
                    !isPlayerTurn && s.emoBtnDisabled,
                  ]}
                  onPress={() => mode === 'story' ? handleStoryTap(e.id) : handleEmoPress(e.id)}
                  disabled={!isPlayerTurn}
                  activeOpacity={0.75}
                >
                  <Text style={s.emoBtnIcon}>{e.icon}</Text>
                  <Text style={[s.emoBtnLabel,{color:isLit?'white':isLight?colors.mid:'rgba(255,255,255,0.7)'}]}>
                    {e.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {gamePhase==='idle' && (
            <Button label="▶  Start!" onPress={startGame} variant="green" style={{marginTop:8}}/>
          )}

        </ScrollView>
      </SafeAreaView>

      {comboPopLabel && (
        <Animated.View style={[s.comboPop,{
          backgroundColor:comboPopLabel.color,
          transform:[
            {scale:comboAnim.interpolate({inputRange:[0,1],outputRange:[0.5,1]})},
            {translateY:comboAnim.interpolate({inputRange:[0,1],outputRange:[80,0]})},
          ],
          opacity:comboAnim,
        }]} pointerEvents="none">
          <Text style={s.comboPopTxt}>{comboPopLabel.label}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:  {flex:1},
  safe:  {flex:1},
  scroll:{padding:spacing.lg, paddingBottom:40},

  starsWrap:{position:'absolute',top:0,left:0,right:0,bottom:0},
  star:     {position:'absolute',borderRadius:99,backgroundColor:'white'},

  hud:      {flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:spacing.sm},
  hudPills: {flexDirection:'row',gap:8},

  worldBanner:    {borderRadius:radius.lg,paddingVertical:6,paddingHorizontal:14,flexDirection:'row',alignItems:'center',gap:8,marginBottom:spacing.sm},
  worldBannerTxt: {fontFamily:fonts.display,fontSize:14,color:'white',fontWeight:'800',flex:1},
  multiBadge:     {backgroundColor:'#FFD93D',borderRadius:50,paddingVertical:3,paddingHorizontal:10},
  multiBadgeTxt:  {fontFamily:fonts.display,fontSize:11,color:'#1e2d3d',fontWeight:'900'},
  shieldBadge:    {backgroundColor:'#4D96FF',borderRadius:50,paddingVertical:3,paddingHorizontal:10},
  shieldBadgeTxt: {fontFamily:fonts.display,fontSize:11,color:'white',fontWeight:'900'},

  comboHint:      {backgroundColor:'rgba(255,255,255,0.1)',borderRadius:radius.md,paddingVertical:5,paddingHorizontal:10,marginRight:8,borderWidth:1,alignItems:'center'},
  comboHintLabel: {fontFamily:fonts.body,fontSize:9,fontWeight:'800',marginTop:2},

  storyCard:       {borderRadius:radius.xl,padding:spacing.md,marginBottom:spacing.md,...shadows.md},
  storyCardHeader: {flexDirection:'row',alignItems:'center',gap:12,marginBottom:10},
  storyPalEmoji:   {fontSize:44},
  storyCardMeta:   {flex:1},
  storyPalName:    {fontFamily:fonts.display,fontSize:14,color:'white',fontWeight:'800'},
  storyScore:      {fontFamily:fonts.body,fontSize:11,color:'rgba(255,255,255,0.6)',marginTop:2},
  storyCardText:   {fontFamily:fonts.display,fontSize:16,color:'white',lineHeight:24,fontWeight:'700',marginBottom:10},
  storyPrompt:     {fontFamily:fonts.body,fontSize:12,color:'rgba(255,255,255,0.6)',textAlign:'center'},
  storyResultBadge:{backgroundColor:'rgba(107,203,119,0.3)',borderRadius:radius.md,padding:10,marginTop:4},
  storyResultTxt:  {fontFamily:fonts.display,fontSize:14,color:'white',fontWeight:'800',textAlign:'center'},

  speedBar:  {height:10,backgroundColor:'rgba(255,255,255,0.2)',borderRadius:8,overflow:'hidden',marginBottom:spacing.md},
  speedFill: {height:10,borderRadius:8},

  stage:    {borderRadius:radius.xl,padding:spacing.lg,alignItems:'center',marginBottom:spacing.md,...shadows.lg,minHeight:190,justifyContent:'center'},
  emoLabel: {borderRadius:50,paddingVertical:6,paddingHorizontal:20,marginBottom:10},
  emoLabelTxt:{fontFamily:fonts.display,fontSize:20,color:'white'},
  palEmoji: {fontSize:84,marginBottom:6},
  stageMsg: {fontFamily:fonts.body,fontSize:14,textAlign:'center'},

  seqRow:{flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:6,marginBottom:spacing.sm,minHeight:26},
  seqDot:{width:20,height:20,borderRadius:10,backgroundColor:'rgba(255,255,255,0.3)',borderWidth:2,borderColor:'rgba(255,255,255,0.5)'},

  levelRow:  {flexDirection:'row',alignItems:'center',gap:8,marginBottom:spacing.md},
  lvlBadge:  {backgroundColor:'rgba(0,0,0,0.3)',borderRadius:50,paddingVertical:3,paddingHorizontal:10},
  lvlBadgeTxt:{fontFamily:fonts.display,fontSize:12,color:'white'},
  lvlTrack:  {flex:1,height:8,backgroundColor:'rgba(255,255,255,0.2)',borderRadius:8,overflow:'hidden'},
  lvlFill:   {height:8,borderRadius:8},
  roundHint: {fontFamily:fonts.body,fontSize:10,minWidth:70,textAlign:'right'},

  emoGrid:        {flexDirection:'row',flexWrap:'wrap',gap:10,marginBottom:spacing.md},
  emoBtn:         {width:'22%',flexGrow:1,borderRadius:radius.lg,padding:10,alignItems:'center',borderWidth:2,borderColor:'rgba(255,255,255,0.2)',...shadows.sm},
  emoBtnDisabled: {opacity:0.5},
  emoBtnIcon:     {fontSize:26,marginBottom:3},
  emoBtnLabel:    {fontFamily:fonts.body,fontSize:9,textTransform:'uppercase',letterSpacing:0.8},

  comboPop:    {position:'absolute',bottom:120,alignSelf:'center',borderRadius:radius.xl,paddingVertical:14,paddingHorizontal:28,...shadows.lg},
  comboPopTxt: {fontFamily:fonts.displayBold,fontSize:22,color:'white',fontWeight:'900'},

  overCard:  {backgroundColor:'white',borderRadius:radius.xl,padding:spacing.lg,alignItems:'center',...shadows.lg,width:'100%'},
  overTitle: {fontFamily:fonts.displayBold,fontSize:26,color:colors.dark,marginBottom:8,textAlign:'center'},
  overSub:   {fontFamily:fonts.body,fontSize:13,color:colors.dim,marginBottom:16,textAlign:'center',lineHeight:20},
  worldBadge:    {borderRadius:radius.lg,paddingVertical:5,paddingHorizontal:12,marginBottom:12},
  worldBadgeTxt: {fontFamily:fonts.display,fontSize:13,color:'white',fontWeight:'800'},
  overStats: {flexDirection:'row',gap:12,marginBottom:20},
  ostat:     {backgroundColor:'#f5faff',borderRadius:radius.md,padding:12,minWidth:72,alignItems:'center'},
  ostatV:    {fontFamily:fonts.displayBold,fontSize:24,color:colors.dark},
  ostatL:    {fontFamily:fonts.body,fontSize:9,color:colors.dim,textTransform:'uppercase',letterSpacing:1},

  capBox:    {backgroundColor:'rgba(77,150,255,0.08)',borderRadius:radius.lg,padding:spacing.md,width:'100%',marginBottom:spacing.md,borderWidth:1,borderColor:'rgba(255,217,61,0.3)'},
  capBoxTitle:{fontFamily:fonts.displayBold,fontSize:16,color:colors.dark,marginBottom:6},
  capBoxSub: {fontFamily:fonts.bodyReg,fontSize:13,color:colors.mid,lineHeight:20},
  capCta:    {borderRadius:radius.xl,overflow:'hidden',width:'100%',marginBottom:10,...shadows.lg},
  capCtaGrad:{padding:16,alignItems:'center'},
  capCtaTxt: {fontFamily:fonts.displayBold,fontSize:17,color:'white'},
});