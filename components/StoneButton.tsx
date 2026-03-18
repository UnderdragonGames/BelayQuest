import { Image, Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";

const btnL = require("@/assets/images/ui/StoneBtnLeft.webp");
const btnM = require("@/assets/images/ui/StoneBtnMid.webp");
const btnR = require("@/assets/images/ui/StoneBtnRight.webp");
const btnDL = require("@/assets/images/ui/StoneBtnDownLeft.webp");
const btnDM = require("@/assets/images/ui/StoneBtnDownMid.webp");
const btnDR = require("@/assets/images/ui/StoneBtnDownRight.webp");

// StoneButton (16x16) at 3x, 9-slice borders: L=7 R=7 T=6 B=8
const CAP_W = 21;
const H = 48;

interface StoneButtonProps {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
}

export function StoneButton({ label, onPress, style }: StoneButtonProps) {
  return (
    <Pressable onPress={onPress} style={[styles.pressable, style]}>
      {({ pressed }) => (
        <>
          {/* Background: 3-slice sprite row, absolutely positioned */}
          <View style={styles.row}>
            <Image source={pressed ? btnDL : btnL} style={styles.cap} />
            <Image source={pressed ? btnDM : btnM} style={styles.mid} resizeMode="stretch" />
            <Image source={pressed ? btnDR : btnR} style={styles.cap} />
          </View>
          {/* Label: normal flow child — drives content width */}
          <Text style={[styles.label, pressed && styles.labelPressed]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    height: H,
    justifyContent: "center",
    alignItems: "center",
  },
  row: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
  },
  cap: {
    width: CAP_W,
    height: H,
  },
  mid: {
    flex: 1,
    height: H,
  },
  label: {
    textAlign: "center",
    fontFamily: "VT323",
    fontSize: 20,
    color: "#e8d8c0",
    paddingHorizontal: CAP_W + 4,
    paddingBottom: 3,
  },
  labelPressed: {
    paddingTop: 3,
    paddingBottom: 0,
  },
});
