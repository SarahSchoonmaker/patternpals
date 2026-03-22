// src/hooks/useStorage.js
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "pf_save_v2";
const GROUP_KEY = "pf_group_v1";

// Journey levels
export const JOURNEY_LEVELS = [
  { level: 1, title: "Feelings Beginner", xpReq: 0, badge: "🌱" },
  { level: 2, title: "Feelings Explorer", xpReq: 50, badge: "🔍" },
  { level: 3, title: "Feelings Friend", xpReq: 200, badge: "💛" },
  { level: 4, title: "Feelings Helper", xpReq: 500, badge: "🤝" },
  { level: 5, title: "Feelings Champion", xpReq: 1000, badge: "🏆" },
  { level: 6, title: "Feelings Master", xpReq: 2000, badge: "⭐" },
  { level: 7, title: "Feelings Legend", xpReq: 4000, badge: "👑" },
];

export function getJourneyLevel(totalXP) {
  let current = JOURNEY_LEVELS[0];
  for (const jl of JOURNEY_LEVELS) {
    if (totalXP >= jl.xpReq) current = jl;
  }
  const idx = JOURNEY_LEVELS.indexOf(current);
  const next = JOURNEY_LEVELS[idx + 1] || null;
  const pct = next
    ? ((totalXP - current.xpReq) / (next.xpReq - current.xpReq)) * 100
    : 100;
  return { current, next, pct: Math.min(100, pct) };
}

// Feeling of the Day — rotates daily
const EMOTION_IDS = [
  "happy",
  "silly",
  "shy",
  "brave",
  "sleepy",
  "angry",
  "excited",
  "scared",
];
export function getFeelingOfDay() {
  const dayIndex = Math.floor(Date.now() / 86400000) % EMOTION_IDS.length;
  return EMOTION_IDS[dayIndex];
}

const DEFAULT_SAVE = {
  xp: 0,
  totalXP: 0,
  best: 0,
  streak: 0,
  sessions: 0,
  lastDate: "",
  selPal: "panda",
  emoCounts: {},
  weekScores: [0, 0, 0, 0, 0, 0, 0],
  maxLevel: 0,
  maxStreak: 0,
  dailyDone: "",
  achievements: [],
  sessionsToday: 0,
  playerName: "You",
  weeklyScore: 0,
  weeklyReset: "",
  personalBests: [],
  groupCode: "",
  groupName: "",
};

export async function loadSave() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SAVE };
    const d = JSON.parse(raw);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (d.lastDate && d.lastDate !== today && d.lastDate !== yesterday) {
      d.streak = 0;
    }
    const weekStart = getWeekStart();
    if (d.weeklyReset !== weekStart) {
      d.weeklyScore = 0;
      d.weeklyReset = weekStart;
    }
    return { ...DEFAULT_SAVE, ...d };
  } catch {
    return { ...DEFAULT_SAVE };
  }
}

export async function patchSave(patch) {
  try {
    const current = await loadSave();
    const updated = { ...current, ...patch };
    await AsyncStorage.setItem(KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return null;
  }
}

export async function recordGameEnd(score, level, streak, emoCounts) {
  const d = await loadSave();
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  const newStreak =
    d.lastDate === yesterday
      ? (d.streak || 0) + 1
      : d.lastDate === today
        ? d.streak
        : 1;

  const dayOfWeek = new Date().getDay();
  const weekScores = [...(d.weekScores || [0, 0, 0, 0, 0, 0, 0])];
  weekScores[dayOfWeek] = Math.max(weekScores[dayOfWeek] || 0, score);

  const mergedEmos = { ...(d.emoCounts || {}) };
  Object.entries(emoCounts).forEach(([k, v]) => {
    mergedEmos[k] = (mergedEmos[k] || 0) + v;
  });

  const xpGain = 10 + level * 3;

  const entry = { date: today, score, level };
  const bests = [...(d.personalBests || []), entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const weeklyScore = Math.max(d.weeklyScore || 0, score);

  if (d.groupCode) {
    await updateGroupScore(
      d.groupCode,
      d.playerName || "Player",
      score,
      d.selPal || "panda",
    );
  }

  return patchSave({
    best: Math.max(d.best || 0, score),
    sessions: (d.sessions || 0) + 1,
    sessionsToday: d.lastDate === today ? (d.sessionsToday || 0) + 1 : 1,
    streak: newStreak,
    lastDate: today,
    weekScores,
    maxLevel: Math.max(d.maxLevel || 0, level),
    maxStreak: Math.max(d.maxStreak || 0, streak),
    emoCounts: mergedEmos,
    xp: (d.xp || 0) + xpGain,
    totalXP: (d.totalXP || 0) + xpGain,
    personalBests: bests,
    weeklyScore,
    weeklyReset: getWeekStart(),
  });
}

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const d = new Date(now);
  d.setDate(diff);
  return d.toDateString();
}

export async function createGroup(groupName, playerName, palEmoji) {
  const code = generateCode();
  const entry = {
    code,
    name: groupName,
    members: [
      {
        name: playerName,
        emoji: palEmoji,
        score: 0,
        weekScore: 0,
        isOwner: true,
      },
    ],
    created: Date.now(),
  };
  await AsyncStorage.setItem(`${GROUP_KEY}_${code}`, JSON.stringify(entry));
  await patchSave({ groupCode: code, groupName, playerName });
  return code;
}

export async function joinGroup(code, playerName, palEmoji) {
  try {
    const raw = await AsyncStorage.getItem(
      `${GROUP_KEY}_${code.toUpperCase()}`,
    );
    if (!raw) return null;
    const group = JSON.parse(raw);
    const exists = group.members.find((m) => m.name === playerName);
    if (!exists) {
      group.members.push({
        name: playerName,
        emoji: palEmoji,
        score: 0,
        weekScore: 0,
      });
      await AsyncStorage.setItem(
        `${GROUP_KEY}_${code.toUpperCase()}`,
        JSON.stringify(group),
      );
    }
    await patchSave({
      groupCode: code.toUpperCase(),
      groupName: group.name,
      playerName,
    });
    return group;
  } catch {
    return null;
  }
}

export async function loadGroup(code) {
  try {
    const raw = await AsyncStorage.getItem(`${GROUP_KEY}_${code}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function updateGroupScore(code, playerName, score, palEmoji) {
  try {
    const raw = await AsyncStorage.getItem(`${GROUP_KEY}_${code}`);
    if (!raw) return;
    const group = JSON.parse(raw);
    const member = group.members.find((m) => m.name === playerName);
    if (member) {
      member.score = Math.max(member.score || 0, score);
      member.weekScore = Math.max(member.weekScore || 0, score);
      member.emoji = palEmoji;
    }
    await AsyncStorage.setItem(`${GROUP_KEY}_${code}`, JSON.stringify(group));
  } catch {}
}

export async function leaveGroup() {
  await patchSave({ groupCode: "", groupName: "", playerName: "You" });
}

export function getDemoLeaderboard(playerScore, playerName, palEmoji) {
  const demos = [
    { name: "Emma", emoji: "🐱", score: 280, weekScore: 180 },
    { name: "Liam", emoji: "🦊", score: 250, weekScore: 160 },
    { name: "Sophia", emoji: "🐰", score: 210, weekScore: 140 },
    { name: "Noah", emoji: "🐼", score: 190, weekScore: 120 },
    { name: "Olivia", emoji: "🐻", score: 170, weekScore: 100 },
    { name: "Jackson", emoji: "🦁", score: 150, weekScore: 80 },
  ];
  const you = {
    name: playerName || "You",
    emoji: palEmoji || "🐼",
    score: playerScore || 0,
    weekScore: playerScore || 0,
    isYou: true,
  };
  const all = [...demos, you].sort((a, b) => b.weekScore - a.weekScore);
  return all.map((m, i) => ({ ...m, rank: i + 1 }));
}

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  return Array.from(
    { length: 4 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}
