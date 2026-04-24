// src/screens/PaywallScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { unlockPremium } from "../hooks/useStorage";
import { colors, fonts, radius, shadows, spacing } from "../utils/theme";
// RevenueCat — module level require so Metro bundles it correctly
const _RC = require("react-native-purchases");
const _Purchases = _RC && _RC.default ? _RC.default : _RC;

const FEATURES_FREE = [
  { icon: "🐼", text: "Panda pal only" },
  { icon: "🧠", text: "Classic mode only" },
  { icon: "🎮", text: "Levels 1–10" },
  { icon: "🌟", text: "Feeling of the Day" },
  { icon: "🔥", text: "Daily streak" },
];

const FEATURES_PREMIUM = [
  { icon: "🐾", text: "All 9 Pals to collect" },
  { icon: "⚡", text: "Speed, Mirror & Story modes" },
  { icon: "♾️", text: "Unlimited levels" },
  { icon: "📊", text: "Full Parent Dashboard" },
  { icon: "🎯", text: "Daily Challenges" },
  { icon: "📖", text: "Emotion Journal" },
  { icon: "🚫", text: "Zero ads. Ever." },
  { icon: "🔄", text: "Free updates for life" },
];

export default function PaywallScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { triggerPal } = route?.params || {};

  // Parental gate
  const [gateVisible, setGateVisible] = useState(true);
  const [gateAnswer, setGateAnswer] = useState("");
  const [gateError, setGateError] = useState(false);
  const [gateQ] = useState(() => {
    const a = Math.floor(Math.random() * 8) + 2;
    const b = Math.floor(Math.random() * 8) + 2;
    return { a, b, answer: String(a + b) };
  });

  const [loading, setLoading] = useState(false);

  function checkGate() {
    if (gateAnswer.trim() === gateQ.answer) {
      setGateVisible(false);
      setGateError(false);
      setGateAnswer("");
    } else {
      setGateError(true);
      setGateAnswer("");
    }
  }

  async function handlePurchase() {
    setLoading(true);
    try {
      // Use module-level Purchases
      const P = _Purchases;
      console.log("P.getOfferings:", typeof P?.getOfferings);
      console.log("P.purchasePackage:", typeof P?.purchasePackage);

      if (typeof P?.getOfferings !== "function") {
        setLoading(false);
        Alert.alert(
          "RC Error",
          "P type:" +
            typeof P +
            "\n_RC type:" +
            typeof _RC +
            "\n_RC.default type:" +
            typeof _RC?.default +
            "\nKeys:" +
            JSON.stringify(Object.keys(_RC || {})),
        );
        return;
      }

      // Step 1 — get offerings
      const offerings = await P.getOfferings();
      console.log("Offerings current:", offerings?.current?.identifier);
      console.log(
        "Packages count:",
        offerings?.current?.availablePackages?.length,
      );

      const pkg =
        offerings?.current?.availablePackages?.[0] ||
        Object.values(offerings?.all || {})[0]?.availablePackages?.[0];

      console.log(
        "Package found:",
        pkg?.identifier,
        pkg?.product?.productIdentifier,
      );

      if (!pkg) {
        setLoading(false);
        Alert.alert(
          "Setup Error",
          "No packages found. Current offering: " +
            (offerings?.current?.identifier || "none") +
            " All offerings: " +
            Object.keys(offerings?.all || {}).join(", "),
        );
        return;
      }

      // Step 2 — purchase
      console.log("Attempting purchase...");
      const { customerInfo } = await P.purchasePackage(pkg);
      console.log("Purchase result received");
      // Purchase succeeded — unlock immediately
      await unlockPremium();
      setLoading(false);
      Alert.alert(
        "🎉 Welcome to Premium!",
        "All 9 Pals and every feature are now unlocked!",
        [
          {
            text: "Let's Go!",
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: "Home" }],
              });
            },
          },
        ],
      );
    } catch (e) {
      setLoading(false);
      console.log("Purchase error:", JSON.stringify(e));
      // Check all possible cancel codes
      if (
        e?.userCancelled === true ||
        e?.code === "PURCHASE_CANCELLED" ||
        e?.message?.toLowerCase().includes("cancel") ||
        e?.message?.toLowerCase().includes("dismiss")
      ) {
        // User cancelled — silent, no error
        return;
      }
      // If already purchased — just unlock
      if (
        e?.code === "PRODUCT_ALREADY_PURCHASED" ||
        e?.message?.toLowerCase().includes("already")
      ) {
        await unlockPremium();
        navigation.reset({ index: 0, routes: [{ name: "Home" }] });
        return;
      }
      Alert.alert(
        "Purchase Error",
        "Code: " +
          (e?.code || "none") +
          "\nMessage: " +
          (e?.message || String(e)) +
          "\nCancelled: " +
          e?.userCancelled,
        [{ text: "OK" }],
      );
    }
  }

  async function handleRestore() {
    setLoading(true);
    try {
      const customerInfo = await _Purchases.restorePurchases();
      const isPremium =
        typeof customerInfo.entitlements.active["premium"] !== "undefined";
      if (isPremium) {
        await unlockPremium();
        setLoading(false);
        Alert.alert("✓ Purchase Restored!", "Your premium access is back!", [
          { text: "Great!", onPress: () => navigation.goBack() },
        ]);
      } else {
        setLoading(false);
        Alert.alert(
          "Nothing to Restore",
          "No previous purchase found for this Apple ID.",
        );
      }
    } catch (e) {
      setLoading(false);
      Alert.alert("Restore Failed", "Please try again.");
    }
  }

  // ── PARENTAL GATE ─────────────────────────────────────────
  if (gateVisible) {
    return (
      <View style={s.root}>
        <LinearGradient
          colors={["#0f1f43", "#1f3a6f", "#0b1a2f"]}
          style={StyleSheet.absoluteFill}
        />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <SafeAreaView
            style={s.gateSafe}
            edges={["top", "left", "right", "bottom"]}
          >
            <View style={s.gateCard}>
              <Text style={s.gateIcon}>👨‍👩‍👧</Text>
              <Text style={s.gateTitle}>Parent Check</Text>
              <Text style={s.gateSub}>
                This purchase requires a parent or guardian.{"\n"}
                Please solve this to continue:
              </Text>
              <View style={s.gateQuestion}>
                <Text style={s.gateQText}>
                  What is {gateQ.a} + {gateQ.b}?
                </Text>
              </View>
              <TextInput
                style={[s.gateInput, gateError && s.gateInputError]}
                value={gateAnswer}
                onChangeText={(t) => {
                  setGateAnswer(t.replace(/[^0-9]/g, ""));
                  setGateError(false);
                }}
                keyboardType="number-pad"
                placeholder="Type your answer"
                placeholderTextColor="rgba(255,255,255,0.3)"
                maxLength={3}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={checkGate}
              />
              {gateError && (
                <Text style={s.gateErrorMsg}>That's not right — try again</Text>
              )}
              <TouchableOpacity
                style={s.gateBtn}
                onPress={checkGate}
                activeOpacity={0.88}
              >
                <Text style={s.gateBtnTxt}>Continue →</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ marginTop: 20, alignItems: "center" }}
              >
                <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // ── PAYWALL ───────────────────────────────────────────────
  return (
    <View style={s.root}>
      <LinearGradient
        colors={["#0f1f43", "#1f3a6f", "#0b1a2f"]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }} edges={["left", "right", "bottom"]}>
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingTop: insets.top + 16 }]}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={s.closeBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={s.closeTxt}>✕</Text>
          </TouchableOpacity>

          <View style={s.header}>
            <Text style={s.crown}>👑</Text>
            <Text style={s.heroTitle}>Unlock All Pals</Text>
            <Text style={s.heroSub}>
              One price. Everything included. Forever.
            </Text>
          </View>

          {triggerPal && (
            <View style={s.palPreview}>
              <Text style={{ fontSize: 44 }}>{triggerPal.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.palPreviewName}>
                  {triggerPal.name} wants to play!
                </Text>
                <Text style={s.palPreviewStory}>{triggerPal.story}</Text>
              </View>
            </View>
          )}

          <View style={s.palRow}>
            {["🐼", "🦊", "🐰", "🐱", "🐻", "🦉", "🦁", "🐉", "🦄"].map(
              (e, i) => (
                <View key={i} style={[s.palBubble, i === 0 && s.palBubbleFree]}>
                  <Text style={s.palBubbleEmo}>{e}</Text>
                  {i === 0 && <Text style={s.freeBadge}>FREE</Text>}
                </View>
              ),
            )}
          </View>

          <View style={s.compareRow}>
            <View style={[s.compareCol, s.freeCol]}>
              <Text style={s.colTitle}>Free</Text>
              {FEATURES_FREE.map((f, i) => (
                <View key={i} style={s.featureRow}>
                  <Text style={s.featureIcon}>{f.icon}</Text>
                  <Text style={s.featureTxt}>{f.text}</Text>
                </View>
              ))}
            </View>
            <LinearGradient
              colors={["#1a2a50", "#2a3a70"]}
              style={[s.compareCol, s.premiumCol]}
            >
              <View style={s.premiumBadge}>
                <Text style={s.premiumBadgeTxt}>PREMIUM</Text>
              </View>
              {FEATURES_PREMIUM.map((f, i) => (
                <View key={i} style={s.featureRow}>
                  <Text style={s.featureIcon}>{f.icon}</Text>
                  <Text style={[s.featureTxt, { color: "white" }]}>
                    {f.text}
                  </Text>
                </View>
              ))}
            </LinearGradient>
          </View>

          <View style={s.priceBlock}>
            <Text style={s.priceAmount}>$7.99</Text>
            <Text style={s.priceDesc}>One-time purchase · No subscription</Text>
            <Text style={s.priceFamily}>✓ Family Sharing included</Text>
          </View>

          <TouchableOpacity
            style={s.ctaBtn}
            onPress={handlePurchase}
            activeOpacity={0.88}
            disabled={loading}
          >
            <LinearGradient
              colors={["#FFD93D", "#FF9A3C"]}
              style={s.ctaGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="white" size="large" />
              ) : (
                <>
                  <Text style={s.ctaTxt}>Unlock All Pals — $7.99</Text>
                  <Text style={s.ctaSub}>One-time · Yours forever</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleRestore}
            style={s.restoreBtn}
            disabled={loading}
          >
            <Text style={s.restoreTxt}>Restore Previous Purchase</Text>
          </TouchableOpacity>

          <Text style={s.legal}>
            Payment charged to your Apple ID at confirmation. One-time purchase
            — no recurring charges.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  gateSafe: { flex: 1, justifyContent: "center", padding: spacing.lg },
  gateCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  gateIcon: { fontSize: 56, marginBottom: 12 },
  gateTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 26,
    color: "white",
    marginBottom: 8,
  },
  gateSub: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  gateQuestion: {
    backgroundColor: "rgba(255,217,61,0.15)",
    borderRadius: radius.lg,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,217,61,0.4)",
  },
  gateQText: {
    fontFamily: fonts.displayBold,
    fontSize: 32,
    color: "#FFD93D",
    textAlign: "center",
  },
  gateInput: {
    width: "100%",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    borderRadius: radius.lg,
    padding: 14,
    fontFamily: fonts.displayBold,
    fontSize: 28,
    color: "white",
    textAlign: "center",
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  gateInputError: { borderColor: "#FF6B6B" },
  gateErrorMsg: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: "#FF9A9A",
    marginBottom: 10,
  },
  gateBtn: {
    width: "100%",
    backgroundColor: "#4D96FF",
    borderRadius: radius.lg,
    padding: 16,
    alignItems: "center",
  },
  gateBtnTxt: { fontFamily: fonts.displayBold, fontSize: 18, color: "white" },
  scroll: { padding: spacing.lg, paddingBottom: 50 },
  closeBtn: {
    alignSelf: "flex-end",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  closeTxt: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
  },
  header: { alignItems: "center", marginBottom: spacing.lg },
  crown: { fontSize: 60, marginBottom: 8 },
  heroTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 32,
    color: "white",
    marginBottom: 6,
    textAlign: "center",
  },
  heroSub: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
  },
  palPreview: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: spacing.md,
  },
  palPreviewName: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: "white",
    fontWeight: "800",
    marginBottom: 3,
  },
  palPreviewStory: {
    fontFamily: fonts.bodyReg,
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    lineHeight: 18,
  },
  palRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  palBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  palBubbleFree: {
    backgroundColor: "rgba(107,203,119,0.25)",
    borderWidth: 2,
    borderColor: "#6BCB77",
  },
  palBubbleEmo: { fontSize: 26 },
  freeBadge: {
    position: "absolute",
    bottom: -8,
    backgroundColor: "#6BCB77",
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  compareRow: { flexDirection: "row", gap: 10, marginBottom: spacing.lg },
  compareCol: { flex: 1, borderRadius: radius.lg, padding: spacing.md },
  freeCol: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  premiumCol: { borderWidth: 1.5, borderColor: "rgba(255,217,61,0.4)" },
  colTitle: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
  },
  premiumBadge: {
    backgroundColor: "#FFD93D",
    borderRadius: 50,
    paddingVertical: 3,
    paddingHorizontal: 12,
    alignSelf: "center",
    marginBottom: 12,
  },
  premiumBadgeTxt: {
    fontFamily: fonts.display,
    fontSize: 11,
    color: "#1e2d3d",
    fontWeight: "900",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  featureIcon: { fontSize: 16 },
  featureTxt: {
    fontFamily: fonts.bodyReg,
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    flex: 1,
    lineHeight: 17,
  },
  priceBlock: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: "center",
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  priceAmount: {
    fontFamily: fonts.displayBold,
    fontSize: 44,
    color: "#FFD93D",
  },
  priceDesc: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
  },
  priceFamily: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: "#6BCB77",
    marginTop: 6,
  },
  ctaBtn: {
    borderRadius: radius.xl,
    overflow: "hidden",
    marginBottom: spacing.md,
    ...shadows.lg,
  },
  ctaGradient: { padding: 20, alignItems: "center" },
  ctaTxt: { fontFamily: fonts.displayBold, fontSize: 20, color: "white" },
  ctaSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 3,
  },
  restoreBtn: { alignItems: "center", marginBottom: spacing.md, padding: 10 },
  restoreTxt: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: "rgba(255,255,255,0.4)",
  },
  legal: {
    fontFamily: fonts.bodyReg,
    fontSize: 10,
    color: "rgba(255,255,255,0.25)",
    textAlign: "center",
    lineHeight: 16,
  },
});
