import { Image, ImageStyle, StyleProp } from "react-native";
import { ICONS, IconName } from "@/assets/images/icons";

interface PixelIconProps {
  name: IconName;
  size?: number;
  style?: StyleProp<ImageStyle>;
}

/**
 * Renders a pixel-art icon from the BelayQuest sprite sheet.
 *
 * Uses nearest-neighbor interpolation to keep pixel edges crisp at any size.
 *
 * @example
 *   <PixelIcon name="swords" size={24} />
 *   <PixelIcon name="crown" size={48} style={{ opacity: 0.8 }} />
 */
export function PixelIcon({ name, size = 24, style }: PixelIconProps) {
  return (
    <Image
      source={ICONS[name]}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
    />
  );
}
