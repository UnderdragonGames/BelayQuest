import { StyleSheet, View, ViewProps } from "react-native";
import { COLORS } from "@/lib/theme";

interface ParchmentPanelProps extends ViewProps {
  children: React.ReactNode;
}

/**
 * Parchment-styled container with warm background and pixel-art border.
 */
export function ParchmentPanel({ children, style, ...props }: ParchmentPanelProps) {
  return (
    <View style={[styles.outer, style]} {...props}>
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: "#c4a882",
    borderWidth: 3,
    borderColor: "#5a4230",
    borderRadius: 4,
    // Pixel-art double border effect
    shadowColor: "#3b2a1a",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  inner: {
    borderWidth: 1,
    borderColor: "#a8906e",
    borderRadius: 2,
    margin: 2,
    padding: 12,
  },
});
