import React, { useEffect, useRef, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  SharedValue,
} from "react-native-reanimated";
import { COLORS } from "@/lib/theme";
import { levelProgress } from "@/lib/xp/calculator";

const frameDecor = require("@/assets/images/ui/ParchmentFrameDecoratedA.webp");

// ─── Sound stub ────────────────────────────────────────────────
export function playSound(_name: "levelUp") {
  // TODO: wire to expo-av when audio assets are ready
}

// ─── Particle ─────────────────────────────────────────────────
const PARTICLE_COUNT = 12;

function Particle({ index, trigger }: { index: number; trigger: number }) {
  // Precompute fixed angle/distance per particle (stable across renders)
  const angle = (index / PARTICLE_COUNT) * Math.PI * 2;
  const dist = 80 + (index % 3) * 20; // 80, 100, or 120
  const tx = Math.cos(angle) * dist;
  const ty = Math.sin(angle) * dist;

  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    if (trigger === 0) return;
    x.value = 0;
    y.value = 0;
    opacity.value = 0;
    scale.value = 0;

    opacity.value = withSequence(
      withTiming(1, { duration: 80 }),
      withDelay(350, withTiming(0, { duration: 300 }))
    );
    scale.value = withSequence(
      withSpring(1, { damping: 5, stiffness: 300 }),
      withDelay(350, withTiming(0, { duration: 300 }))
    );
    x.value = withTiming(tx, { duration: 600, easing: Easing.out(Easing.quad) });
    y.value = withTiming(ty, { duration: 600, easing: Easing.out(Easing.quad) });
  }, [trigger]);

  const colors = [COLORS.primary, "#ffffff", COLORS.xp];
  const color = colors[index % colors.length];

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: color,
  }));

  return <Animated.View style={style} />;
}

// ─── AnimatedXpBar ─────────────────────────────────────────────
// Inline animated XP bar for the modal. Animates fill smoothly.
function AnimatedXpBar({ progress, label }: { progress: SharedValue<number>; label: string }) {
  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.round(progress.value * 100)}%`,
  }));

  return (
    <View style={xpStyles.wrapper}>
      <View style={xpStyles.track}>
        <Animated.View style={[xpStyles.fill, fillStyle]} />
      </View>
      {label && <Text style={xpStyles.label}>{label}</Text>}
    </View>
  );
}

const xpStyles = StyleSheet.create({
  wrapper: { width: "100%" },
  track: {
    height: 16,
    backgroundColor: COLORS.bg,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: "#5a4230",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: COLORS.xp,
  },
  label: {
    fontFamily: "VT323",
    fontSize: 13,
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 3,
  },
});

// ─── LevelUpModalProps ────────────────────────────────────────
export interface LevelUpModalProps {
  /** Array of levels gained in order, e.g. [5, 6, 7] */
  levels: number[];
  /** Total XP after all levels gained */
  totalXpAfter: number;
  visible: boolean;
  onDismiss: () => void;
}

/**
 * RPG level-up celebration modal.
 * Shows each level sequentially with bounce + particles + animated XP bar.
 * Auto-advances after 800ms per level; tap to skip.
 */
export function LevelUpModal({
  levels,
  totalXpAfter,
  visible,
  onDismiss,
}: LevelUpModalProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [particleTrigger, setParticleTrigger] = React.useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const levelScale = useSharedValue(0);
  const levelOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.8);
  const cardOpacity = useSharedValue(0);
  const xpProgress = useSharedValue(0);

  const currentLevel = levels[Math.min(currentIndex, levels.length - 1)];
  const isLastLevel = currentIndex >= levels.length - 1;

  const advance = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (isLastLevel) {
      onDismiss();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [isLastLevel, onDismiss]);

  // Animate card in/out when modal visibility changes
  useEffect(() => {
    if (!visible) {
      setCurrentIndex(0);
      xpProgress.value = 0;
      cardScale.value = 0.8;
      cardOpacity.value = 0;
      return;
    }
    cardScale.value = withSpring(1, { damping: 14, stiffness: 180 });
    cardOpacity.value = withTiming(1, { duration: 250 });
  }, [visible]);

  // Animate level number + particles on each level shown
  useEffect(() => {
    if (!visible) return;

    levelScale.value = 0;
    levelOpacity.value = 0;
    xpProgress.value = 0;

    playSound("levelUp");
    setParticleTrigger((t) => t + 1);

    // Punchy bounce on level number
    levelScale.value = withSequence(
      withSpring(1.5, { damping: 4, stiffness: 400 }),
      withSpring(1.0, { damping: 12, stiffness: 200 })
    );
    levelOpacity.value = withTiming(1, { duration: 100 });

    // XP bar fills to target progress
    const targetProgress = isLastLevel ? levelProgress(totalXpAfter) : 0.1;
    xpProgress.value = withDelay(
      250,
      withTiming(targetProgress, { duration: 700, easing: Easing.out(Easing.cubic) })
    );

    // Auto-advance or auto-dismiss
    timerRef.current = setTimeout(() => {
      if (isLastLevel) {
        timerRef.current = setTimeout(onDismiss, 500);
      } else {
        setCurrentIndex((i) => i + 1);
      }
    }, 850);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, visible]);

  const levelStyle = useAnimatedStyle(() => ({
    transform: [{ scale: levelScale.value }],
    opacity: levelOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={advance}
    >
      <Pressable style={styles.backdrop} onPress={advance}>
        <Animated.View style={[styles.card, cardStyle]}>
          {/* Corner frame decorations */}
          <Image source={frameDecor} style={[styles.corner, styles.cornerTL]} />
          <Image
            source={frameDecor}
            style={[styles.corner, styles.cornerTR]}
            // Mirror horizontally for top-right
          />
          <Image source={frameDecor} style={[styles.corner, styles.cornerBL]} />
          <Image source={frameDecor} style={[styles.corner, styles.cornerBR]} />

          <View style={styles.content}>
            {/* Title */}
            <Text style={styles.title}>LEVEL UP!</Text>

            {/* Particle burst + level number */}
            <View style={styles.particleOrigin}>
              {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
                <Particle key={i} index={i} trigger={particleTrigger} />
              ))}
              <Animated.Text style={[styles.levelNumber, levelStyle]}>
                {currentLevel}
              </Animated.Text>
            </View>

            {/* Chain indicator */}
            {levels.length > 1 && (
              <Text style={styles.chainLabel}>
                {isLastLevel
                  ? `${levels.length}× LEVEL CHAIN COMPLETE!`
                  : `${currentIndex + 1} / ${levels.length}`}
              </Text>
            )}

            {/* Animated XP bar */}
            <View style={styles.xpSection}>
              <Text style={styles.xpLabel}>XP Progress</Text>
              <AnimatedXpBar
                progress={xpProgress}
                label={`Level ${currentLevel} → ${currentLevel + 1}`}
              />
            </View>

            <Text style={styles.hint}>
              {isLastLevel ? "Tap to close" : "Tap to continue"}
            </Text>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const { width } = Dimensions.get("window");
const CARD_W = Math.min(width - 48, 340);
const CORNER_SIZE = 44;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 9, 3, 0.88)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: CARD_W,
    backgroundColor: "#c4a882",
    borderWidth: 3,
    borderColor: "#5a4230",
    borderRadius: 6,
    // Inner double-border effect
    shadowColor: "#3b2a1a",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    zIndex: 1,
  },
  cornerTL: { top: -8, left: -8 },
  cornerTR: { top: -8, right: -8 },
  cornerBL: { bottom: -8, left: -8 },
  cornerBR: { bottom: -8, right: -8 },
  content: {
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  title: {
    fontFamily: "VT323",
    fontSize: 44,
    color: COLORS.primary,
    letterSpacing: 6,
    textShadowColor: "#3b2a1a",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
    marginBottom: 4,
  },
  particleOrigin: {
    width: 130,
    height: 130,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 4,
  },
  levelNumber: {
    fontFamily: "VT323",
    fontSize: 100,
    color: COLORS.text,
    lineHeight: 108,
    textShadowColor: COLORS.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  chainLabel: {
    fontFamily: "VT323",
    fontSize: 16,
    color: COLORS.muted,
    letterSpacing: 1,
    marginBottom: 12,
  },
  xpSection: {
    width: "100%",
    marginBottom: 18,
  },
  xpLabel: {
    fontFamily: "VT323",
    fontSize: 15,
    color: COLORS.muted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  hint: {
    fontFamily: "VT323",
    fontSize: 15,
    color: COLORS.muted,
    letterSpacing: 1,
    opacity: 0.7,
  },
});
