import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LevelUpModal } from './LevelUpModal';
import { COLORS } from '@/lib/theme';

export default { title: 'LevelUp Modal' };

// ─── Interactive demo with controls ──────────────────────────

function LevelUpDemo({
  startLevel,
  levelsGained,
}: {
  startLevel: number;
  levelsGained: number;
}) {
  const [visible, setVisible] = useState(false);

  const levels = Array.from(
    { length: levelsGained },
    (_, i) => startLevel + i + 1
  );

  // Simulate totalXpAfter: enough to be partway through the last gained level
  // xpForLevel uses 2x curve: level N = 10 * 2^(N-2)
  const lastLevel = levels[levels.length - 1];
  const totalXpAfter = 10 * Math.pow(2, lastLevel - 2) + 5; // 5 XP into the new level

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Level-Up Modal</Text>
      <Text style={styles.sub}>
        Start level: {startLevel} · Gain: {levelsGained} level
        {levelsGained > 1 ? 's' : ''} → reach level {startLevel + levelsGained}
      </Text>

      <Pressable style={styles.btn} onPress={() => setVisible(true)}>
        <Text style={styles.btnLabel}>TRIGGER LEVEL UP</Text>
      </Pressable>

      <LevelUpModal
        visible={visible}
        levels={levels}
        totalXpAfter={totalXpAfter}
        onDismiss={() => setVisible(false)}
      />
    </View>
  );
}

// Single level-up
export const SingleLevel = () => <LevelUpDemo startLevel={4} levelsGained={1} />;

// Double level-up
export const DoubleLevel = () => <LevelUpDemo startLevel={7} levelsGained={2} />;

// Triple chain
export const TripleChain = () => <LevelUpDemo startLevel={2} levelsGained={3} />;

// 5-level chain (max)
export const MaxChain = () => <LevelUpDemo startLevel={1} levelsGained={5} />;

// High level
export const HighLevel = () => <LevelUpDemo startLevel={19} levelsGained={1} />;

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  heading: {
    fontFamily: 'VT323',
    fontSize: 32,
    color: COLORS.primary,
    letterSpacing: 3,
    marginBottom: 8,
  },
  sub: {
    fontFamily: 'VT323',
    fontSize: 16,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: 32,
  },
  btn: {
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 4,
  },
  btnLabel: {
    fontFamily: 'VT323',
    fontSize: 22,
    color: COLORS.primary,
    letterSpacing: 2,
  },
});
