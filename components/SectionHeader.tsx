import { Image, StyleSheet, Text, View } from "react-native";

const scrollLeft = require("@/assets/images/ui/ScrollLeft.webp");
const scrollMid = require("@/assets/images/ui/ScrollMid.webp");
const scrollRight = require("@/assets/images/ui/ScrollRight.webp");

// Scroll (96x40) at 2x: caps 92+90, mid 10, H=80
const CAP_L = 92;
const CAP_R = 90;
const H = 80;

interface SectionHeaderProps {
  title: string;
}

export function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Image source={scrollLeft} style={styles.capL} />
      <Image source={scrollMid} style={styles.mid} resizeMode="stretch" />
      <Image source={scrollRight} style={styles.capR} />
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: H,
    marginVertical: 8,
  },
  capL: {
    width: CAP_L,
    height: H,
  },
  capR: {
    width: CAP_R,
    height: H,
  },
  mid: {
    flex: 1,
    height: H,
  },
  title: {
    position: "absolute",
    width: "100%",
    textAlign: "center",
    fontFamily: "VT323",
    fontSize: 22,
    color: "#3b2a1a",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
});
