/**
 * ForgeAnimation — avatar materialization effect.
 *
 * 4-phase animation covering the PixelLab API call latency:
 *   Phase 1 (Ignition, 0-0.5s): frame glows, particles drift in from edges
 *   Phase 2 (Coalescence, 0.5s+): particles swirl, center brightens (loops until API returns)
 *   Phase 3 (Reveal): white flash, avatar fades in, particles burst outward
 *   Phase 4 (Idle): avatar alive with subtle sparkles
 *
 * Usage:
 *   <ForgeAnimation
 *     avatarColors={["#4a3020", "#2a4a6a", ...]}  // from picker state
 *     avatarUrl={avatarUrl}                         // null while pending, URL when ready
 *     onRevealComplete={() => ...}
 *   />
 */

import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Image, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  cancelAnimation,
  runOnJS,
} from "react-native-reanimated";
import { COLORS } from "@/lib/theme";

// ─── Types ────────────────────────────────────────────────────
type Phase = "forging" | "revealing" | "done";

export type ForgeAnimationProps = {
  /** Colors from the avatar picker (used to tint particles) */
  avatarColors: string[];
  /** null while generating, URL when the avatar is ready */
  avatarUrl: string | null;
  /** Frame size in logical pixels (default 120) */
  size?: number;
  /** Called after the reveal animation completes */
  onRevealComplete?: () => void;
};

// ─── Particle config ──────────────────────────────────────────
const NUM_PARTICLES = 24;
const PARTICLE_SIZE = 4;

type ParticleConfig = {
  angle: number;
  color: string;
  delay: number;
};

function buildParticleConfigs(colors: string[]): ParticleConfig[] {
  const palette =
    colors.length > 0
      ? colors
      : [COLORS.primary, "#d48a2a", "#a86a1a"];

  return Array.from({ length: NUM_PARTICLES }, (_, i) => ({
    angle: (i / NUM_PARTICLES) * Math.PI * 2,
    color: palette[i % palette.length],
    delay: (i % 6) * 80,
  }));
}

// ─── Particle component ──────────────────────────────────────
type ParticleProps = {
  config: ParticleConfig;
  phase: Phase;
  frameSize: number;
};

function Particle({ config, phase, frameSize }: ParticleProps) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);
  const pScale = useSharedValue(1);

  useEffect(() => {
    cancelAnimation(progress);
    cancelAnimation(opacity);
    cancelAnimation(pScale);

    if (phase === "forging") {
      opacity.value = withDelay(
        config.delay,
        withTiming(0.85, { duration: 300 })
      );
      progress.value = withDelay(
        config.delay,
        withRepeat(
          withSequence(
            withTiming(0.72, {
              duration: 1400,
              easing: Easing.inOut(Easing.sin),
            }),
            withTiming(0.15, {
              duration: 900,
              easing: Easing.inOut(Easing.sin),
            })
          ),
          -1,
          false
        )
      );
      pScale.value = 1;
    } else if (phase === "revealing") {
      // burst outward and vanish
      progress.value = withTiming(-0.45, {
        duration: 450,
        easing: Easing.out(Easing.cubic),
      });
      pScale.value = withSequence(
        withTiming(2.2, { duration: 150 }),
        withTiming(0, { duration: 350 })
      );
      opacity.value = withSequence(
        withTiming(1, { duration: 80 }),
        withDelay(180, withTiming(0, { duration: 320 }))
      );
    } else {
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [phase]);

  const style = useAnimatedStyle(() => {
    const center = frameSize / 2;
    const maxRadius = center + 10;
    const dist = maxRadius * (1 - progress.value);
    const x = Math.cos(config.angle) * dist;
    const y = Math.sin(config.angle) * dist;
    return {
      transform: [
        { translateX: center + x - PARTICLE_SIZE / 2 },
        { translateY: center + y - PARTICLE_SIZE / 2 },
        { scale: pScale.value },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[styles.particle, { backgroundColor: config.color }, style]}
    />
  );
}

// ─── Lingering sparkle (post-reveal) ─────────────────────────
type SparkleProps = {
  x: number;
  y: number;
  delay: number;
  visible: boolean;
};

function Sparkle({ x, y, delay, visible }: SparkleProps) {
  const opacity = useSharedValue(0);
  const sparkScale = useSharedValue(0.5);

  useEffect(() => {
    if (!visible) {
      opacity.value = 0;
      return;
    }
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 200 }),
          withTiming(0, { duration: 600 }),
          withTiming(0, { duration: 2200 }) // pause before next sparkle
        ),
        -1,
        false
      )
    );
    sparkScale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.4, { duration: 200 }),
          withTiming(0.6, { duration: 600 }),
          withTiming(0.6, { duration: 2200 })
        ),
        -1,
        false
      )
    );
  }, [visible]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: sparkScale.value }],
  }));

  return (
    <Animated.View style={[styles.sparkle, { left: x, top: y }, style]} />
  );
}

// ─── Main component ──────────────────────────────────────────
export function ForgeAnimation({
  avatarColors,
  avatarUrl,
  size = 120,
  onRevealComplete,
}: ForgeAnimationProps) {
  const phase = useRef<Phase>("forging");
  const phaseState = useSharedValue<number>(0); // 0=forging, 1=revealing, 2=done

  // Frame glow
  const glowOpacity = useSharedValue(0);
  // Center brightness overlay
  const centerGlow = useSharedValue(0);
  // White flash on reveal
  const flashOpacity = useSharedValue(0);
  // Avatar
  const avatarOpacity = useSharedValue(0);
  const avatarScale = useSharedValue(0.8);

  const [currentPhase, setCurrentPhase] = React.useState<Phase>("forging");
  const [particleConfigs] = React.useState(() =>
    buildParticleConfigs(avatarColors)
  );

  // ── Start forging animations on mount ─────────────────────
  useEffect(() => {
    // Frame glow pulses
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.25, { duration: 600, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    // Center glow builds gradually
    centerGlow.value = withDelay(
      500,
      withTiming(0.3, { duration: 2000 })
    );
  }, []);

  // ── Trigger reveal when avatarUrl arrives ─────────────────
  useEffect(() => {
    if (!avatarUrl || currentPhase !== "forging") return;

    phase.current = "revealing";
    setCurrentPhase("revealing");

    // Stop frame glow loop and settle
    cancelAnimation(glowOpacity);
    glowOpacity.value = withTiming(0, { duration: 600 });
    cancelAnimation(centerGlow);
    centerGlow.value = withTiming(0, { duration: 400 });

    // White flash
    flashOpacity.value = withSequence(
      withTiming(0.85, { duration: 120 }),
      withTiming(0, { duration: 400 })
    );

    // Avatar fade in (slightly after flash peak)
    avatarOpacity.value = withDelay(
      80,
      withTiming(1, { duration: 350 })
    );
    avatarScale.value = withDelay(
      80,
      withTiming(1, { duration: 350, easing: Easing.out(Easing.back(1.5)) })
    );

    // Transition to done after reveal
    const timer = setTimeout(() => {
      phase.current = "done";
      setCurrentPhase("done");
      onRevealComplete?.();
    }, 550);

    return () => clearTimeout(timer);
  }, [avatarUrl]);

  // ── Animated styles ───────────────────────────────────────
  const glowStyle = useAnimatedStyle(() => ({
    borderColor: COLORS.primary,
    opacity: glowOpacity.value,
  }));

  const centerGlowStyle = useAnimatedStyle(() => ({
    opacity: centerGlow.value,
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const avatarStyle = useAnimatedStyle(() => ({
    opacity: avatarOpacity.value,
    transform: [{ scale: avatarScale.value }],
  }));

  // Web fallback — simpler, no particles
  if (Platform.OS === "web") {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <View style={[styles.frameBase, { borderRadius: 6 }]} />
        {avatarUrl && (
          <Animated.Image
            source={{ uri: avatarUrl }}
            style={[styles.avatar, avatarStyle, { width: size, height: size }]}
            resizeMode="contain"
          />
        )}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.flashOverlay,
            flashStyle,
          ]}
        />
      </View>
    );
  }

  // Sparkle positions (relative to frame top-left)
  const sparkles = [
    { x: size * 0.1, y: size * 0.1 },
    { x: size * 0.85, y: size * 0.1 },
    { x: size * 0.5, y: -8 },
    { x: size * 0.1, y: size * 0.85 },
    { x: size * 0.85, y: size * 0.85 },
  ];

  return (
    <View
      style={[styles.container, { width: size, height: size }]}
    >
      {/* Base frame */}
      <View style={[styles.frameBase, { width: size, height: size }]} />

      {/* Animated glow border */}
      <Animated.View
        style={[
          styles.glowBorder,
          { width: size, height: size },
          glowStyle,
        ]}
      />

      {/* Center brightness overlay */}
      <Animated.View
        style={[
          styles.centerGlow,
          { width: size, height: size },
          centerGlowStyle,
        ]}
      />

      {/* Particles */}
      <View
        style={[
          StyleSheet.absoluteFillObject,
          { width: size, height: size, overflow: "visible" },
        ]}
        pointerEvents="none"
      >
        {particleConfigs.map((cfg, i) => (
          <Particle
            key={i}
            config={cfg}
            phase={currentPhase}
            frameSize={size}
          />
        ))}
      </View>

      {/* Avatar image */}
      {avatarUrl && (
        <Animated.Image
          source={{ uri: avatarUrl }}
          style={[styles.avatar, { width: size, height: size }, avatarStyle]}
          resizeMode="contain"
        />
      )}

      {/* Flash overlay */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          styles.flashOverlay,
          flashStyle,
        ]}
        pointerEvents="none"
      />

      {/* Idle sparkles (post-reveal) */}
      {sparkles.map((pos, i) => (
        <Sparkle
          key={`sparkle-${i}`}
          x={pos.x}
          y={pos.y}
          delay={i * 600}
          visible={currentPhase === "done"}
        />
      ))}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  frameBase: {
    position: "absolute",
    backgroundColor: COLORS.bg,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 6,
  },
  glowBorder: {
    position: "absolute",
    borderWidth: 3,
    borderRadius: 6,
    backgroundColor: "transparent",
  },
  centerGlow: {
    position: "absolute",
    borderRadius: 6,
    backgroundColor: "#d4a44a",
  },
  particle: {
    position: "absolute",
    width: PARTICLE_SIZE,
    height: PARTICLE_SIZE,
    borderRadius: 1,
  },
  avatar: {
    position: "absolute",
  },
  flashOverlay: {
    borderRadius: 6,
    backgroundColor: "#ffffff",
  },
  sparkle: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
});
