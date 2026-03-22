// src/components/UI.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, radius, shadows, spacing } from '../utils/theme';

// ── Button ──────────────────────────────────────────────────────
export function Button({ label, onPress, variant = 'green', disabled, style, textStyle, icon }) {
  const gradients = {
    green:  [colors.green, colors.greenDark],
    blue:   [colors.blue, colors.blueDark],
    gold:   [colors.gold, colors.orange],
    soft:   [colors.white, colors.white],
    dark:   [colors.dark, '#2d3f55'],
  };
  const textColors = {
    green: '#fff', blue: '#fff', gold: '#fff', soft: colors.dark, dark: '#fff',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[styles.btnWrap, disabled && styles.btnDisabled, style]}
    >
      <LinearGradient
        colors={gradients[variant] || gradients.green}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.btnGradient}
      >
        {icon && <Text style={styles.btnIcon}>{icon}</Text>}
        <Text style={[styles.btnText, { color: textColors[variant] || '#fff' }, textStyle]}>
          {label}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ── Card ──────────────────────────────────────────────────────
export function Card({ children, style }) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

// ── Pill (score display) ─────────────────────────────────────
export function Pill({ value, label, style }) {
  return (
    <View style={[styles.pill, style]}>
      <Text style={styles.pillVal}>{value}</Text>
      <Text style={styles.pillLbl}>{label}</Text>
    </View>
  );
}

// ── SectionTitle ─────────────────────────────────────────────
export function SectionTitle({ children, style }) {
  return <Text style={[styles.sectionTitle, style]}>{children}</Text>;
}

// ── ProgressBar ─────────────────────────────────────────────
export function ProgressBar({ pct, color = colors.green, height = 10, style }) {
  return (
    <View style={[styles.pbTrack, { height }, style]}>
      <View style={[styles.pbFill, { width: `${Math.min(100, pct)}%`, backgroundColor: color, height }]} />
    </View>
  );
}

// ── BackButton ──────────────────────────────────────────────
export function BackButton({ onPress, label = '←' }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.backBtn} activeOpacity={0.8}>
      <Text style={styles.backBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── EmptyState ──────────────────────────────────────────────
export function EmptyState({ icon, message }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyMsg}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btnWrap: {
    borderRadius: radius.full,
    overflow: 'hidden',
    ...shadows.md,
  },
  btnDisabled: { opacity: 0.45 },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    gap: 8,
  },
  btnText: {
    fontFamily: fonts.display,
    fontSize: 18,
    letterSpacing: 0.3,
  },
  btnIcon: { fontSize: 18 },

  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },

  pill: {
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignItems: 'center',
    minWidth: 62,
    ...shadows.sm,
  },
  pillVal: { fontFamily: fonts.display, fontSize: 20, color: colors.dark, lineHeight: 24 },
  pillLbl: { fontFamily: fonts.body, fontSize: 9, color: colors.dim, textTransform: 'uppercase', letterSpacing: 1 },

  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.dark,
    marginBottom: spacing.md,
  },

  pbTrack: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  pbFill: {
    borderRadius: 10,
  },

  backBtn: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.sm,
  },
  backBtnText: { fontFamily: fonts.display, fontSize: 18, color: colors.dark },

  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyMsg: { fontFamily: fonts.body, fontSize: 14, color: colors.dim, textAlign: 'center' },
});
