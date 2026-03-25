// src/screens/PaywallScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { unlockPremium, restorePurchase } from "../hooks/useStorage";
import { colors, fonts, radius, shadows, spacing } from "../utils/theme";

const PRODUCT_ID = "com.sschoonm.kindredpal.premium";

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
  const [loading, setLoading] = useState(false);
  const [iapReady, setIapReady] = useState(false);
  const { triggerPal } = route.params || {};

  // Dynamically import IAP to avoid crash if not installed
  const [IAP, setIAP] = useState(null);

  useEffect(() => {
    async function initIAP() {
      try {
        const iap = await import("expo-in-app-purchases");
        setIAP(iap);
        await iap.connectAsync();
        const { results } = await iap.getProductsAsync([PRODUCT_ID]);
        if (results && results.length > 0) {
          setIapReady(true);
        }
      } catch (e) {
        console.log("IAP init error:", e);
        // IAP not available — simulated mode
        setIapReady(true);
      }
    }
    initIAP();

    return () => {
      // Disconnect IAP on unmount
      import("expo-in-app-purchases")
        .then((iap) => {
          iap.disconnectAsync().catch(() => {});
        })
        .catch(() => {});
    };
  }, []);

  async function handlePurchase() {
    setLoading(true);
    try {
      if (IAP && iapReady) {
        // Real StoreKit purchase
        IAP.setPurchaseListener(
          async ({ responseCode, results, errorCode }) => {
            if (responseCode === IAP.IAPResponseCode.OK) {
              for (const purchase of results) {
                if (!purchase.acknowledged) {
                  await IAP.finishTransactionAsync(purchase, true);
                }
              }
              await unlockPremium();
              setLoading(false);
              Alert.alert(
                "🎉 Welcome to Premium!",
                "All 9 Pals and every feature are now unlocked!",
                [{ text: "Let's Go!", onPress: () => navigation.goBack() }],
              );
            } else if (responseCode === IAP.IAPResponseCode.USER_CANCELED) {
              setLoading(false);
            } else {
              setLoading(false);
              Alert.alert("Purchase Failed", "Please try again.");
            }
          },
        );
        await IAP.purchaseItemAsync(PRODUCT_ID);
      } else {
        // Simulated purchase for testing / IAP not available
        await new Promise((r) => setTimeout(r, 800));
        await unlockPremium();
        setLoading(false);
        Alert.alert(
          "🎉 Premium Unlocked!",
          "All 9 Pals and every feature are now unlocked!",
          [{ text: "Let's Go!", onPress: () => navigation.goBack() }],
        );
      }
    } catch (e) {
      setLoading(false);
      Alert.alert(
        "Purchase Failed",
        "Please try again or restore a previous purchase.",
      );
    }
  }

  async function handleRestore() {
    setLoading(true);
    try {
      if (IAP) {
        await IAP.connectAsync();
        const { responseCode, results } = await IAP.getPurchaseHistoryAsync();
        if (responseCode === IAP.IAPResponseCode.OK) {
          const found = results?.find((p) => p.productId === PRODUCT_ID);
          if (found) {
            await unlockPremium();
            setLoading(false);
            Alert.alert(
              "✓ Purchase Restored!",
              "Your premium access is back!",
              [{ text: "Great!", onPress: () => navigation.goBack() }],
            );
            return;
          }
        }
      }
      setLoading(false);
      Alert.alert(
        "Nothing to Restore",
        "No previous purchase found for this Apple ID.",
      );
    } catch (e) {
      setLoading(false);
      Alert.alert("Restore Failed", "Please try again.");
    }
  }

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
          {/* Close button */}
          <TouchableOpacity
            style={s.closeBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={s.closeTxt}>✕</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={s.header}>
            <Text style={s.crown}>👑</Text>
            <Text style={s.heroTitle}>Unlock All Pals</Text>
            <Text style={s.heroSub}>
              One price. Everything included. Forever.
            </Text>
          </View>

          {/* Triggered pal preview */}
          {triggerPal && (
            <View style={s.palPreview}>
              <Text style={s.palPreviewEmo}>{triggerPal.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.palPreviewName}>
                  {triggerPal.name} wants to play!
                </Text>
                <Text style={s.palPreviewStory}>{triggerPal.story}</Text>
              </View>
            </View>
          )}

          {/* Pal parade */}
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

          {/* Feature compare */}
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

          {/* Price */}
          <View style={s.priceBlock}>
            <Text style={s.priceAmount}>$7.99</Text>
            <Text style={s.priceDesc}>One-time purchase · No subscription</Text>
            <Text style={s.priceFamily}>✓ Family Sharing included</Text>
          </View>

          {/* Purchase button */}
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

          {/* Restore */}
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
  palPreviewEmo: { fontSize: 44 },
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
