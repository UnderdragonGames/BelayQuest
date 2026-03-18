import { StyleSheet, View, Text, Image } from "react-native";
import { COLORS } from "@/lib/theme";

const barLeft = require("@/assets/images/ui/BarLeft.webp");
const barMid = require("@/assets/images/ui/BarMid.webp");
const barRight = require("@/assets/images/ui/BarRight.webp");

// HealthBarMetalBorder (32x8) at 3x: L=57, mid=12, R=27, H=24
// Fill area measured from actual pixels: navy #000F1C region
// Vertical: y=9..17, Horizontal: x=0..86 (right border at x=87)
const BAR_H = 24;
const CAP_L = 57;
const CAP_R = 27;
const FILL_TOP = 9;
const FILL_BOTTOM = 6;
const FILL_LEFT = 0;
const FILL_RIGHT = 9;

interface XpBarProps {
  progress: number; // 0-1
  label?: string;
}

export function XpBar({ progress, label }: XpBarProps) {
  const percent = Math.round(Math.max(0, Math.min(1, progress)) * 100);

  return (
    <View style={styles.wrapper}>
      <View style={styles.barRow}>
        {/* Frame (opaque dark center) */}
        <View style={styles.frameRow}>
          <Image source={barLeft} style={styles.capL} />
          <Image source={barMid} style={styles.mid} resizeMode="stretch" />
          <Image source={barRight} style={styles.capR} />
        </View>
        {/* Fill on top, clipped to inner area */}
        <View style={styles.fillTrack}>
          <View style={[styles.fill, { width: `${percent}%` }]} />
        </View>
      </View>
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  barRow: {
    height: BAR_H,
    position: "relative",
  },
  frameRow: {
    flexDirection: "row",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: BAR_H,
  },
  capL: {
    width: CAP_L,
    height: BAR_H,
  },
  capR: {
    width: CAP_R,
    height: BAR_H,
  },
  mid: {
    flex: 1,
    height: BAR_H,
  },
  fillTrack: {
    position: "absolute",
    top: FILL_TOP,
    bottom: FILL_BOTTOM,
    left: FILL_LEFT,
    right: FILL_RIGHT,
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: COLORS.xp,
  },
  label: {
    fontFamily: "VT323",
    fontSize: 14,
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 4,
  },
});
