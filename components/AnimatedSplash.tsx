import { useEffect } from "react";
import { Image, StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { COLORS } from "@/lib/theme";

const ICON_SOURCE = require("@/assets/images/icon.png");

// Timing (ms)
const HOLD_DURATION = 600;
const GLOW_DURATION = 500;
const SCALE_UP_DURATION = 400;
const FADE_OUT_DURATION = 350;

interface Props {
  onFinish: () => void;
}

/**
 * Animated splash outro — RPG-themed transition from splash to app.
 *
 * Sequence:
 *   1. Icon + title hold briefly
 *   2. Golden glow pulse on the icon
 *   3. Icon scales up while fading out
 *   4. Background fades to transparent, revealing the app
 */
export function AnimatedSplash({ onFinish }: Props) {
  const { width } = useWindowDimensions();
  const iconSize = Math.min(width * 0.45, 240);

  const iconOpacity = useSharedValue(1);
  const iconScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const bgOpacity = useSharedValue(1);
  const titleOpacity = useSharedValue(1);

  useEffect(() => {
    // 1. Hold, then golden glow pulse
    glowOpacity.value = withDelay(
      HOLD_DURATION,
      withSequence(
        withTiming(1, { duration: GLOW_DURATION, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: GLOW_DURATION, easing: Easing.inOut(Easing.ease) })
      )
    );

    // 2. Scale up + fade out icon after glow
    const outStart = HOLD_DURATION + GLOW_DURATION;
    iconScale.value = withDelay(
      outStart,
      withTiming(1.3, { duration: SCALE_UP_DURATION, easing: Easing.out(Easing.quad) })
    );
    iconOpacity.value = withDelay(
      outStart,
      withTiming(0, { duration: FADE_OUT_DURATION, easing: Easing.in(Easing.ease) })
    );
    titleOpacity.value = withDelay(
      outStart,
      withTiming(0, { duration: FADE_OUT_DURATION * 0.7, easing: Easing.in(Easing.ease) })
    );

    // 3. Background fades last
    bgOpacity.value = withDelay(
      outStart + SCALE_UP_DURATION * 0.5,
      withTiming(0, { duration: FADE_OUT_DURATION }, (finished) => {
        if (finished) runOnJS(onFinish)();
      })
    );
  }, []);

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, bgStyle]} pointerEvents="none">
      <View style={styles.content}>
        <View style={{ width: iconSize, height: iconSize }}>
          <Animated.Image
            source={ICON_SOURCE}
            style={[{ width: iconSize, height: iconSize, borderRadius: iconSize * 0.18 }, iconStyle]}
          />
          {/* Golden glow overlay */}
          <Animated.View
            style={[
              {
                ...StyleSheet.absoluteFillObject,
                borderRadius: iconSize * 0.18,
                backgroundColor: COLORS.primary,
              },
              glowStyle,
            ]}
          />
        </View>
        <Animated.Text style={[styles.title, titleStyle]}>Belay Quest</Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.bg,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  content: {
    alignItems: "center",
    gap: 24,
  },
  title: {
    fontFamily: "VT323",
    fontSize: 36,
    color: COLORS.primary,
    letterSpacing: 2,
  },
});
