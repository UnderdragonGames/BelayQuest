/**
 * Avatar Customization Picker
 *
 * Allows users to configure their avatar's appearance (colors, hair, gear).
 * Saves to user.avatarDefaults in Convex. The stored values will drive pixel
 * sprite rendering once the sprite sheet system is integrated.
 */
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { router } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { COLORS } from "@/lib/theme";
import { SectionHeader } from "@/components/SectionHeader";
import { StoneButton } from "@/components/StoneButton";
import { Avatar } from "@/components/Avatar";
import { ForgeAnimation } from "@/components/ForgeAnimation";

// ─── Avatar state type ────────────────────────────────────────
type AvatarState = {
  hair: "medium" | "hat";
  hairColor: string;
  skinTone: 1 | 2 | 3;
  glasses: boolean;
  glassesColor?: string;
  shirtColor: string;
  pantsType: "pants" | "shorts";
  pantsColor: string;
  harness: boolean;
  harnessColor?: string;
  shoeColor: string;
};

// ─── Default avatar values ────────────────────────────────────
const DEFAULT_AVATAR: AvatarState = {
  hair: "medium",
  hairColor: "#4a3020",
  skinTone: 2,
  glasses: false,
  glassesColor: "#c4a050",
  shirtColor: "#2a4a6a",
  pantsType: "pants",
  pantsColor: "#1a2a4a",
  harness: false,
  harnessColor: "#8a4a20",
  shoeColor: "#3a2a1a",
};

// ─── Color palette ────────────────────────────────────────────
const SWATCHES = [
  "#1a1010", // near black
  "#4a4a4a", // dark grey
  "#8a8a8a", // medium grey
  "#c0c0c0", // silver
  "#4a3020", // dark brown
  "#7a5a38", // medium brown
  "#c4882a", // golden
  "#2a3060", // navy
  "#4a6a8a", // steel blue
  "#2a6a4a", // forest green
  "#6a2a2a", // dark red
  "#8a6a2a", // olive
  "#6a2a6a", // purple
  "#c4a882", // parchment
  "#e0c8a0", // cream
  "#e8e8e8", // white
];

// ─── ColorRow ────────────────────────────────────────────────
function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.swatchRow}>
        {SWATCHES.map((swatch) => (
          <Pressable
            key={swatch}
            onPress={() => onChange(swatch)}
            style={[
              styles.swatch,
              { backgroundColor: swatch },
              value === swatch && styles.swatchSelected,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

// ─── ToggleRow ────────────────────────────────────────────────
function ToggleRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.toggleRow}>
        {options.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              styles.toggleButton,
              value === opt.value && styles.toggleButtonActive,
            ]}
          >
            <Text
              style={[
                styles.toggleText,
                value === opt.value && styles.toggleTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ─── BoolRow ─────────────────────────────────────────────────
function BoolRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <ToggleRow
      label={label}
      options={[
        { label: "Yes", value: "yes" },
        { label: "No", value: "no" },
      ]}
      value={value ? "yes" : "no"}
      onChange={(v) => onChange(v === "yes")}
    />
  );
}

// ─── AvatarColorPreview ────────────────────────────────────────
// Shows the currently-selected colors as a pixel-art inspired swatch grid.
function AvatarColorPreview({ avatar }: { avatar: AvatarState }) {
  const SKIN_TONES = ["#f5d0a0", "#c8965a", "#7a5030"];
  const skinColor = SKIN_TONES[avatar.skinTone - 1];

  return (
    <View style={previewStyles.container}>
      <View style={previewStyles.grid}>
        <Chip label="Skin" color={skinColor} />
        <Chip label="Hair" color={avatar.hairColor} />
        <Chip label="Shirt" color={avatar.shirtColor} />
        <Chip label="Pants" color={avatar.pantsColor} />
        <Chip label="Shoes" color={avatar.shoeColor} />
        {avatar.glasses && avatar.glassesColor && (
          <Chip label="Glasses" color={avatar.glassesColor} />
        )}
        {avatar.harness && avatar.harnessColor && (
          <Chip label="Harness" color={avatar.harnessColor} />
        )}
      </View>
    </View>
  );
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <View style={previewStyles.chip}>
      <View style={[previewStyles.dot, { backgroundColor: color }]} />
      <Text style={previewStyles.chipLabel}>{label}</Text>
    </View>
  );
}

const previewStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipLabel: {
    fontFamily: "VT323",
    fontSize: 14,
    color: COLORS.muted,
  },
});

// ─── AvatarPickerScreen ───────────────────────────────────────
export default function AvatarPickerScreen() {
  const me = useQuery(api.users.me);
  const saveDefaults = useMutation(api.users.updateAvatarDefaults);
  const generateAvatar = useAction(api.avatarGenerate.generateAvatar);
  const [avatar, setAvatar] = useState<AvatarState>(DEFAULT_AVATAR);
  const [initialized, setInitialized] = useState(false);
  const [forging, setForging] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Seed from saved avatarDefaults when loaded
  useEffect(() => {
    if (me !== undefined && !initialized) {
      if (me?.avatarDefaults) {
        setAvatar({
          ...DEFAULT_AVATAR,
          ...me.avatarDefaults,
        });
      }
      setInitialized(true);
    }
  }, [me, initialized]);

  // Show existing avatar URL on init
  useEffect(() => {
    if (me?.avatarUrl && !generatedUrl && !forging) {
      setGeneratedUrl(me.avatarUrl);
    }
  }, [me?.avatarUrl]);

  function set<K extends keyof AvatarState>(key: K, value: AvatarState[K]) {
    setAvatar((prev) => ({ ...prev, [key]: value }));
  }

  const avatarColors = [
    avatar.hairColor,
    avatar.shirtColor,
    avatar.pantsColor,
    avatar.shoeColor,
  ];

  async function handleForge() {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    setForging(true);
    setGeneratedUrl(null);
    try {
      const avatarArgs = {
        hair: avatar.hair,
        hairColor: avatar.hairColor,
        skinTone: avatar.skinTone,
        glasses: avatar.glasses,
        glassesColor: avatar.glasses ? avatar.glassesColor : undefined,
        shirtColor: avatar.shirtColor,
        pantsType: avatar.pantsType,
        pantsColor: avatar.pantsColor,
        harness: avatar.harness,
        harnessColor: avatar.harness ? avatar.harnessColor : undefined,
        shoeColor: avatar.shoeColor,
      };
      const url = await generateAvatar(avatarArgs);
      setGeneratedUrl(url);
      await saveDefaults(avatarArgs);
    } catch (err) {
      setForging(false);
      Alert.alert(
        "Forge Failed",
        err instanceof Error ? err.message : "Could not generate avatar."
      );
    }
    // forging → false triggered by ForgeAnimation.onRevealComplete
  }

  if (!initialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      scrollEnabled={!forging}
    >
      {/* Back button */}
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>Edit Avatar</Text>

      {/* Avatar frame */}
      {forging ? (
        <View style={styles.forgeWrap}>
          <ForgeAnimation
            avatarColors={avatarColors}
            avatarUrl={generatedUrl}
            size={120}
            onRevealComplete={() => setForging(false)}
          />
          {!generatedUrl && (
            <View style={styles.forgingIndicator}>
              <ActivityIndicator color={COLORS.primary} size="small" />
              <Text style={styles.forgingText}>Forging avatar...</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.previewRow}>
          {generatedUrl ? (
            <Image
              source={{ uri: generatedUrl }}
              style={styles.generatedAvatar}
              resizeMode="contain"
            />
          ) : (
            <Avatar seed={me?._id ?? "default"} size={78} />
          )}
        </View>
      )}

      <AvatarColorPreview avatar={avatar} />

      {/* ─── Hair ─── */}
      <SectionHeader title="Hair" />
      <ToggleRow
        label="Style"
        options={[
          { label: "Hair", value: "medium" },
          { label: "Hat", value: "hat" },
        ]}
        value={avatar.hair}
        onChange={(v) => set("hair", v as "medium" | "hat")}
      />
      <ColorRow
        label="Color"
        value={avatar.hairColor}
        onChange={(c) => set("hairColor", c)}
      />

      {/* ─── Skin tone ─── */}
      <SectionHeader title="Skin Tone" />
      <ToggleRow
        label="Tone"
        options={[
          { label: "Light", value: "1" },
          { label: "Medium", value: "2" },
          { label: "Dark", value: "3" },
        ]}
        value={String(avatar.skinTone)}
        onChange={(v) => set("skinTone", Number(v) as 1 | 2 | 3)}
      />

      {/* ─── Glasses ─── */}
      <SectionHeader title="Glasses" />
      <BoolRow
        label="Wears glasses"
        value={avatar.glasses}
        onChange={(v) => set("glasses", v)}
      />
      {avatar.glasses && (
        <ColorRow
          label="Frame color"
          value={avatar.glassesColor ?? "#c4a050"}
          onChange={(c) => set("glassesColor", c)}
        />
      )}

      {/* ─── Shirt ─── */}
      <SectionHeader title="Shirt" />
      <ColorRow
        label="Color"
        value={avatar.shirtColor}
        onChange={(c) => set("shirtColor", c)}
      />

      {/* ─── Pants ─── */}
      <SectionHeader title="Pants" />
      <ToggleRow
        label="Style"
        options={[
          { label: "Pants", value: "pants" },
          { label: "Shorts", value: "shorts" },
        ]}
        value={avatar.pantsType}
        onChange={(v) => set("pantsType", v as "pants" | "shorts")}
      />
      <ColorRow
        label="Color"
        value={avatar.pantsColor}
        onChange={(c) => set("pantsColor", c)}
      />

      {/* ─── Harness ─── */}
      <SectionHeader title="Harness" />
      <BoolRow
        label="Wears harness"
        value={avatar.harness}
        onChange={(v) => set("harness", v)}
      />
      {avatar.harness && (
        <ColorRow
          label="Color"
          value={avatar.harnessColor ?? "#8a4a20"}
          onChange={(c) => set("harnessColor", c)}
        />
      )}

      {/* ─── Shoes ─── */}
      <SectionHeader title="Shoes" />
      <ColorRow
        label="Color"
        value={avatar.shoeColor}
        onChange={(c) => set("shoeColor", c)}
      />

      {/* Forge / Save */}
      <View style={styles.saveWrap}>
        {!forging && (
          <>
            <StoneButton
              label="Forge New Avatar"
              onPress={handleForge}
              style={{ alignSelf: "stretch" }}
            />
            {generatedUrl && (
              <StoneButton
                label="Done"
                onPress={() => router.back()}
                style={{ alignSelf: "stretch" }}
              />
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop:
      Platform.OS === "ios" ? 60 : (StatusBar.currentHeight ?? 24) + 16,
    paddingBottom: 48,
  },
  backButton: {
    marginBottom: 8,
  },
  backText: {
    fontFamily: "VT323",
    fontSize: 18,
    color: COLORS.primary,
  },
  title: {
    fontFamily: "VT323",
    fontSize: 32,
    color: COLORS.text,
    marginBottom: 16,
  },
  forgeWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    marginBottom: 12,
    overflow: "visible",
  },
  forgingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  forgingText: {
    fontFamily: "VT323",
    fontSize: 18,
    color: COLORS.primary,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 12,
  },
  previewLabel: {
    flex: 1,
  },
  previewNote: {
    fontFamily: "VT323",
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 20,
  },

  // ─── Field rows ──────────────────────────────────
  fieldRow: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontFamily: "VT323",
    fontSize: 15,
    color: COLORS.muted,
    textTransform: "uppercase",
    marginBottom: 6,
  },

  // ─── Toggle ──────────────────────────────────────
  toggleRow: {
    flexDirection: "row",
    gap: 8,
  },
  toggleButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 4,
  },
  toggleButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "20",
  },
  toggleText: {
    fontFamily: "VT323",
    fontSize: 16,
    color: COLORS.muted,
  },
  toggleTextActive: {
    color: COLORS.primary,
  },

  // ─── Color swatches ───────────────────────────────
  swatchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "transparent",
  },
  swatchSelected: {
    borderColor: COLORS.text,
  },

  // ─── Save ─────────────────────────────────────────
  saveWrap: {
    marginTop: 24,
    gap: 12,
  },

  // ─── Generated avatar display ─────────────────────
  generatedAvatar: {
    width: 144,
    height: 144,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 6,
    backgroundColor: COLORS.bg,
  },
});
