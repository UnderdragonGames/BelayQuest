import { Image, ImageBackground, StyleSheet } from "react-native";

const frame = require("@/assets/images/ui/DecoratedSquare3x.webp");
const portrait = require("@/assets/images/ui/Portrait.webp");

// DecoratedSquare (26x26) at 3x = 78x78, borders: 12;12;12;12 → inner = 42x42 at 3x
const FRAME_SIZE = 78;
const INNER_INSET = 36; // 12*3

interface AvatarProps {
  seed: string;
  size?: number;
  avatarUrl?: string | null;
}

/**
 * Pixel-art avatar in a DecoratedSquare metal frame.
 * Shows the user's generated avatar if available, otherwise a placeholder.
 */
export function Avatar({ seed, size = FRAME_SIZE, avatarUrl }: AvatarProps) {
  const innerSize = size - INNER_INSET;
  return (
    <ImageBackground
      source={frame}
      style={[styles.frame, { width: size, height: size }]}
      resizeMode="stretch"
    >
      <Image
        source={avatarUrl ? { uri: avatarUrl } : portrait}
        style={{ width: innerSize, height: innerSize }}
        resizeMode="contain"
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: "center",
    justifyContent: "center",
  },
});
