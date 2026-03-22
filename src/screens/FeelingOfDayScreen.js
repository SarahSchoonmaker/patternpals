// src/screens/FeelingOfDayScreen.js
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { loadSave, patchSave, getFeelingOfDay } from "../hooks/useStorage";
import { EMOTIONS } from "../data/gameData";
import { colors, fonts, radius, shadows, spacing } from "../utils/theme";
import { BackButton, Button } from "../components/UI";

// Conversation starters for each emotion — for parents
const CONVERSATION_STARTERS = {
  happy: [
    "When did you feel really happy today?",
    "What makes you feel the happiest?",
    "Can you think of something that makes your heart feel full?",
  ],
  silly: [
    "What's the silliest thing you've ever done?",
    "When is it okay to be silly?",
    "What makes you laugh the most?",
  ],
  shy: [
    "When do you feel shy?",
    "What helps you feel brave when you're shy?",
    "Is it okay to feel shy sometimes?",
  ],
  brave: [
    "What's something brave you did recently?",
    "How does being brave feel inside?",
    "Who is the bravest person you know?",
  ],
  sleepy: [
    "What helps you feel cozy at bedtime?",
    "What do you dream about?",
    "Why is sleep so important for our bodies?",
  ],
  angry: [
    "What makes you feel angry?",
    "What do you do when you feel angry?",
    "How can we calm down when we're mad?",
  ],
  excited: [
    "What are you most excited about right now?",
    "How does excitement feel in your body?",
    "What's something you can't wait for?",
  ],
  scared: [
    "What makes you feel scared?",
    "What helps you feel safe when you're scared?",
    "Is it okay to feel scared sometimes?",
  ],
};

// Fun facts about each emotion
const EMOTION_FACTS = {
  happy:
    "Did you know? Smiling actually makes your brain release chemicals that make you feel even happier! 😊",
  silly:
    "Fun fact: Laughing uses 15 different muscles in your face! The sillier you are, the stronger your face muscles get! 😂",
  shy: "Did you know? Even famous actors and singers feel shy sometimes. Feeling shy just means you care! 💛",
  brave:
    "Science says: Being brave doesn't mean you're not scared — it means you do it anyway! That's real courage. 💪",
  sleepy:
    "Did you know? Kids your age need 9-12 hours of sleep. Your brain sorts memories while you sleep! 😴",
  angry:
    "Fun fact: Anger is a normal feeling. Even scientists get angry! The important thing is what we do with it. 😤",
  excited:
    "Did you know? Excitement and nervousness feel almost the same in your body — the difference is in how you think about it! 🤩",
  scared:
    "Science says: Fear is your brain trying to protect you. It's actually your body being really smart! 😱",
};

export default function FeelingOfDayScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [save, setSave] = useState(null);
  const [claimed, setClaimed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadSave().then((d) => {
        setSave(d);
        const today = new Date().toDateString();
        setClaimed(d.fotdDone === today);
      });
    }, []),
  );

  if (!save) return null;

  const fotdId = getFeelingOfDay();
  const emotion = EMOTIONS.find((e) => e.id === fotdId) || EMOTIONS[0];
  const starters = CONVERSATION_STARTERS[fotdId] || [];
  const fact = EMOTION_FACTS[fotdId] || "";
  const today = new Date().toDateString();
  const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString("en-US", {
    weekday: "long",
  });

  async function claimBonus() {
    if (claimed) return;
    await patchSave({
      fotdDone: today,
      xp: (save.xp || 0) + 50,
      totalXP: (save.totalXP || 0) + 50,
    });
    setSave(await loadSave());
    setClaimed(true);
  }

  return (
    <View style={s.root}>
      <LinearGradient
        colors={[emotion.color + "55", "#e8f4fd", "#d4f0e0"]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }} edges={["left", "right", "bottom"]}>
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingTop: insets.top + 12 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={s.header}>
            <BackButton onPress={() => navigation.goBack()} />
            <Text style={s.title}>Feeling of the Day</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Main feeling card */}
          <View style={[s.feelingCard, { borderColor: emotion.color + "60" }]}>
            <View style={[s.dateBadge, { backgroundColor: emotion.color }]}>
              <Text style={s.dateTxt}>
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </View>
            <Text style={s.feelingEmoji}>{emotion.icon}</Text>
            <Text style={[s.feelingName, { color: emotion.color }]}>
              {emotion.label}
            </Text>
            <Text style={s.feelingDesc}>{emotion.desc}</Text>

            {/* Bonus XP */}
            {!claimed ? (
              <TouchableOpacity
                style={[s.bonusBtn, { backgroundColor: emotion.color }]}
                onPress={claimBonus}
                activeOpacity={0.85}
              >
                <Text style={s.bonusTxt}>🌟 Play today for +50 Bonus XP!</Text>
                <Text style={s.bonusSub}>Tap to claim your daily bonus</Text>
              </TouchableOpacity>
            ) : (
              <View style={[s.bonusBtn, { backgroundColor: "#6BCB77" }]}>
                <Text style={s.bonusTxt}>✓ Daily bonus claimed! +50 XP</Text>
                <Text style={s.bonusSub}>
                  Come back {tomorrow} for a new feeling!
                </Text>
              </View>
            )}
          </View>

          {/* Play button */}
          <Button
            label={`Play ${emotion.label} Mode Today! ${emotion.icon}`}
            onPress={() =>
              navigation.navigate("Game", {
                mode: "classic",
                focusEmotion: fotdId,
              })
            }
            variant="green"
            style={{ marginBottom: spacing.md }}
          />

          {/* Fun fact */}
          <View style={s.factCard}>
            <Text style={s.factTitle}>🔬 Did You Know?</Text>
            <Text style={s.factTxt}>{fact}</Text>
          </View>

          {/* Conversation starters — for parents */}
          <View style={s.convoCard}>
            <View style={s.convoHeader}>
              <Text style={s.convoTitle}>👨‍👩‍👧 Talk About It</Text>
              <View style={[s.parentTag]}>
                <Text style={s.parentTagTxt}>For Parents</Text>
              </View>
            </View>
            <Text style={s.convoSub}>
              Use these conversation starters at dinner or bedtime to build on
              what your child learned today:
            </Text>
            {starters.map((q, i) => (
              <View key={i} style={s.convoQ}>
                <Text style={[s.convoQNum, { color: emotion.color }]}>
                  {i + 1}
                </Text>
                <Text style={s.convoQTxt}>"{q}"</Text>
              </View>
            ))}
          </View>

          {/* Week preview */}
          <View style={s.weekCard}>
            <Text style={s.weekTitle}>This Week's Feelings</Text>
            <View style={s.weekRow}>
              {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                const dayId =
                  EMOTIONS[
                    Math.floor(
                      (Math.floor(Date.now() / 86400000) -
                        new Date().getDay() +
                        offset) %
                        8,
                    )
                  ].id;
                const dayEmo =
                  EMOTIONS.find((e) => e.id === dayId) || EMOTIONS[offset % 8];
                const dayName = [
                  "Sun",
                  "Mon",
                  "Tue",
                  "Wed",
                  "Thu",
                  "Fri",
                  "Sat",
                ][offset];
                const isToday = offset === new Date().getDay();
                return (
                  <View
                    key={offset}
                    style={[
                      s.weekDay,
                      isToday && { backgroundColor: emotion.color + "30" },
                    ]}
                  >
                    <Text style={s.weekDayName}>{dayName}</Text>
                    <Text style={s.weekDayEmo}>{dayEmo.icon}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
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
  title: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.dark },

  feelingCard: {
    backgroundColor: "white",
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: "center",
    borderWidth: 2,
    marginBottom: spacing.md,
    ...shadows.lg,
  },
  dateBadge: {
    borderRadius: 50,
    paddingVertical: 4,
    paddingHorizontal: 16,
    marginBottom: spacing.md,
  },
  dateTxt: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: "white",
    fontWeight: "800",
  },
  feelingEmoji: { fontSize: 90, marginBottom: 10, lineHeight: 100 },
  feelingName: { fontFamily: fonts.displayBold, fontSize: 38, marginBottom: 6 },
  feelingDesc: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.mid,
    textAlign: "center",
    marginBottom: spacing.lg,
  },

  bonusBtn: {
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: "center",
    width: "100%",
  },
  bonusTxt: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: "white",
    fontWeight: "800",
  },
  bonusSub: {
    fontFamily: fonts.bodyReg,
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 3,
  },

  factCard: {
    backgroundColor: "white",
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  factTitle: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.dark,
    fontWeight: "800",
    marginBottom: 8,
  },
  factTxt: {
    fontFamily: fonts.bodyReg,
    fontSize: 13,
    color: colors.mid,
    lineHeight: 20,
  },

  convoCard: {
    backgroundColor: "white",
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  convoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  convoTitle: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.dark,
    fontWeight: "800",
    flex: 1,
  },
  parentTag: {
    backgroundColor: "#4D96FF",
    borderRadius: 50,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  parentTagTxt: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: "white",
    fontWeight: "800",
  },
  convoSub: {
    fontFamily: fonts.bodyReg,
    fontSize: 12,
    color: colors.dim,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  convoQ: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
    alignItems: "flex-start",
  },
  convoQNum: { fontFamily: fonts.displayBold, fontSize: 18, minWidth: 22 },
  convoQTxt: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.dark,
    flex: 1,
    lineHeight: 20,
  },

  weekCard: {
    backgroundColor: "white",
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  weekTitle: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.dark,
    fontWeight: "800",
    marginBottom: spacing.md,
  },
  weekRow: { flexDirection: "row", gap: 6 },
  weekDay: {
    flex: 1,
    alignItems: "center",
    borderRadius: radius.md,
    padding: 6,
    backgroundColor: "#f5f5f5",
  },
  weekDayName: {
    fontFamily: fonts.body,
    fontSize: 9,
    color: colors.dim,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  weekDayEmo: { fontSize: 20 },
});
