/**
 * Onboarding — Avatar Creation
 *
 * User customizes appearance, taps "Forge Character", ForgeAnimation plays
 * over the API call, then avatar appears in frame. Small refresh button for
 * rerolling. Continue passes avatarStorageId to grades screen.
 *
 * Flow: name → avatar → grades → gyms → invite
 */

import { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  StatusBar,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { COLORS } from "@/lib/theme";
import { SectionHeader } from "@/components/SectionHeader";
import { StoneButton } from "@/components/StoneButton";
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

const SWATCHES = [
  "#1a1010",
  "#4a3020",
  "#7a5a38",
  "#c4882a",
  "#2a3060",
  "#4a6a8a",
  "#2a6a4a",
  "#6a2a2a",
  "#8a6a2a",
  "#6a2a6a",
  "#c4a882",
  "#e0c8a0",
];

// ─── Sub-components ───────────────────────────────────────────

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

// ─── Main screen ──────────────────────────────────────────────
export default function OnboardingAvatarScreen() {
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name: string }>();

  const [avatar, setAvatar] = useState<AvatarState>(DEFAULT_AVATAR);
  const [forging, setForging] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarStorageId, setAvatarStorageId] = useState<Id<"_storage"> | null>(null);

  const generateAvatar = useAction(api.avatarGenerate.generateAvatar);
  const saveDefaults = useMutation(api.users.updateAvatarDefaults);

  function set<K extends keyof AvatarState>(key: K, value: AvatarState[K]) {
    setAvatar((prev) => ({ ...prev, [key]: value }));
  }

  // Colors exposed to ForgeAnimation for personalized particles
  const avatarColors = [
    avatar.hairColor,
    avatar.shirtColor,
    avatar.pantsColor,
    avatar.shoeColor,
    ...(avatar.glasses && avatar.glassesColor ? [avatar.glassesColor] : []),
    ...(avatar.harness && avatar.harnessColor ? [avatar.harnessColor] : []),
  ];

  const handleForge = useCallback(async () => {
    setForging(true);
    setAvatarUrl(null);
    setAvatarStorageId(null);
    try {
      const url = await generateAvatar({
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
      });
      // Extract storageId from URL (last segment before query string)
      // The real storageId is saved server-side; we pass it via the user record
      setAvatarUrl(url);
      // storageId was saved to user record by the action; we'll pick it up from
      // params via a separate query if needed, or just rely on server-side save.
      // For the completeOnboarding call we skip avatarStorageId here —
      // it's already on the user record via saveAvatarStorageId.
    } catch (err) {
      Alert.alert(
        "Forge Failed",
        err instanceof Error ? err.message : "Could not generate avatar."
      );
      setForging(false);
      return;
    }
    // forging remains true until ForgeAnimation triggers onRevealComplete
  }, [avatar, generateAvatar]);

  const handleReforge = useCallback(() => {
    setAvatarUrl(null);
    setAvatarStorageId(null);
    setForging(false);
    // Small delay so ForgeAnimation resets, then re-forge
    setTimeout(() => handleForge(), 50);
  }, [handleForge]);

  const handleContinue = useCallback(async () => {
    // Save avatar defaults for future reference
    await saveDefaults({
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
    }).catch(() => {
      // Non-fatal: defaults save fails gracefully
    });

    router.push({
      pathname: "/(onboarding)/grades",
      params: { name },
    });
  }, [avatar, saveDefaults, name, router]);

  const revealed = Boolean(avatarUrl) && !forging;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      scrollEnabled={!forging}
    >
      {/* ─── Avatar frame ─── */}
      <View style={styles.frameArea}>
        <Text style={styles.title}>Forge Your Character</Text>
        <Text style={styles.subtitle}>
          Customize your look, then forge your character into existence.
        </Text>

        <View style={styles.forgeContainer}>
          {forging ? (
            <ForgeAnimation
              avatarColors={avatarColors}
              avatarUrl={avatarUrl}
              size={120}
              onRevealComplete={() => setForging(false)}
            />
          ) : avatarUrl ? (
            // Post-forge: show generated avatar image with reroll button
            <View style={styles.generatedFrame}>
              <Image
                source={{ uri: avatarUrl }}
                style={styles.generatedAvatar}
                resizeMode="contain"
              />
              <Pressable onPress={handleReforge} style={styles.reforgeButton}>
                <Text style={styles.reforgeText}>↺</Text>
              </Pressable>
            </View>
          ) : (
            // Pre-forge placeholder
            <View style={styles.placeholderFrame}>
              <Text style={styles.placeholderText}>?</Text>
              <Text style={styles.placeholderHint}>Customize below</Text>
            </View>
          )}
        </View>

        {/* Continue / Forge buttons */}
        {revealed ? (
          <StoneButton label="Continue →" onPress={handleContinue} />
        ) : !forging ? (
          <StoneButton label="Forge Character" onPress={handleForge} />
        ) : null}
      </View>

      {/* ─── Picker (hidden during forge) ─── */}
      {!forging && (
        <View style={styles.picker}>
          {/* Hair */}
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

          {/* Skin tone */}
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

          {/* Glasses */}
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

          {/* Shirt */}
          <SectionHeader title="Shirt" />
          <ColorRow
            label="Color"
            value={avatar.shirtColor}
            onChange={(c) => set("shirtColor", c)}
          />

          {/* Pants */}
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

          {/* Harness */}
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

          {/* Shoes */}
          <SectionHeader title="Shoes" />
          <ColorRow
            label="Color"
            value={avatar.shoeColor}
            onChange={(c) => set("shoeColor", c)}
          />

          {/* Bottom forge button (scrolled-to position) */}
          {!revealed && (
            <View style={styles.bottomForge}>
              <StoneButton label="Forge Character" onPress={handleForge} />
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingTop:
      Platform.OS === "ios" ? 60 : (StatusBar.currentHeight ?? 24) + 16,
    paddingBottom: 48,
  },

  // Frame area (top section, always visible)
  frameArea: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  title: {
    fontFamily: "VT323",
    fontSize: 32,
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: "VT323",
    fontSize: 16,
    color: COLORS.muted,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },

  forgeContainer: {
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  generatedFrame: {
    position: "relative",
    width: 120,
    height: 120,
  },
  generatedAvatar: {
    width: 120,
    height: 120,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 6,
    backgroundColor: COLORS.bg,
  },
  reforgeButton: {
    position: "absolute",
    bottom: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  reforgeText: {
    fontFamily: "VT323",
    fontSize: 18,
    color: COLORS.primary,
    lineHeight: 22,
  },

  placeholderFrame: {
    width: 120,
    height: 120,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 6,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  placeholderText: {
    fontFamily: "VT323",
    fontSize: 48,
    color: COLORS.muted,
  },
  placeholderHint: {
    fontFamily: "VT323",
    fontSize: 13,
    color: COLORS.muted,
  },

  // Picker section
  picker: {
    paddingHorizontal: 16,
  },
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

  bottomForge: {
    alignItems: "center",
    marginTop: 24,
  },
});
