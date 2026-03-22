// src/components/BottomNav.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, shadows } from "../utils/theme";

const TABS = [
  { name: "Home", icon: "🏠", label: "Home" },
  { name: "FeelingOfDay", icon: "🌟", label: "Today" },
  { name: "Game", icon: "🎮", label: "Play", params: { mode: "classic" } },
  { name: "Leaderboard", icon: "🏆", label: "Ranks" },
  { name: "Parent", icon: "📊", label: "Parent" },
];

// navigation prop is the navigationRef from App.js
export default function BottomNav({ navigation, currentRoute }) {
  const insets = useSafeAreaInsets();

  // Hide during gameplay so it doesn't distract kids
  if (currentRoute === "Game") return null;

  function goTo(name, params) {
    // navigationRef.current.navigate works from anywhere
    if (navigation?.current) {
      navigation.current.navigate(name, params || {});
    }
  }

  return (
    <View
      style={[
        styles.wrap,
        { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 },
      ]}
    >
      {TABS.map((tab) => {
        const active = currentRoute === tab.name;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => goTo(tab.name, tab.params)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
              <Text style={styles.icon}>{tab.icon}</Text>
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 8,
    paddingHorizontal: 8,
    ...shadows.md,
  },
  tab: { flex: 1, alignItems: "center", gap: 3 },
  iconWrap: {
    width: 44,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: { backgroundColor: "#e8f4fd" },
  icon: { fontSize: 20 },
  label: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.dim,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  labelActive: { color: colors.blue, fontFamily: fonts.display },
});
