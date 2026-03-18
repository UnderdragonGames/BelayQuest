import { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { t } from "@/lib/copy/en";
import { allGrades } from "@/lib/grades/parser";
import { COLORS } from "@/lib/theme";
import { ParchmentPanel } from "@/components/ParchmentPanel";
import { StoneButton } from "@/components/StoneButton";
import { Avatar } from "@/components/Avatar";

const CLIMBING_STYLES = ["Boulder", "Top Rope", "Lead"] as const;
const YEARS_OPTIONS = ["< 1 year", "1-3 years", "3-5 years", "5+ years"] as const;

export default function GradesScreen() {
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name: string }>();

  const [selectedStyles, setSelectedStyles] = useState<Set<string>>(new Set());
  const [routeMin, setRouteMin] = useState("5.7");
  const [routeMax, setRouteMax] = useState("5.10a");
  const [boulderMin, setBoulderMin] = useState("VB");
  const [boulderMax, setBoulderMax] = useState("V3");
  const [yearsClimbing, setYearsClimbing] = useState<string | null>(null);

  const ydsGrades = allGrades("yds");
  const vGrades = allGrades("v_scale");

  const toggleStyle = useCallback((style: string) => {
    setSelectedStyles((prev) => {
      const next = new Set(prev);
      if (style === "All") {
        // Toggle all on/off
        if (next.size === CLIMBING_STYLES.length) {
          next.clear();
        } else {
          CLIMBING_STYLES.forEach((s) => next.add(s));
        }
      } else {
        if (next.has(style)) {
          next.delete(style);
        } else {
          next.add(style);
        }
      }
      return next;
    });
  }, []);

  const canContinue = selectedStyles.size > 0 && yearsClimbing !== null;

  const handleContinue = useCallback(() => {
    router.push({
      pathname: "/(onboarding)/gyms",
      params: {
        name,
        climbingStyles: JSON.stringify([...selectedStyles]),
        gradeRangeRoute: JSON.stringify({ min: routeMin, max: routeMax }),
        gradeRangeBoulder: JSON.stringify({ min: boulderMin, max: boulderMax }),
        yearsClimbing,
      },
    });
  }, [
    router,
    name,
    selectedStyles,
    routeMin,
    routeMax,
    boulderMin,
    boulderMax,
    yearsClimbing,
  ]);

  return (
    <View style={styles.container}>
      {/* Wizard area */}
      <View style={styles.wizardArea}>
        <Avatar seed="wizard" size={78} />
        <ParchmentPanel style={styles.speechBubble}>
          <View style={styles.speechTail} />
          <Text style={styles.speechText}>{t("wizard.grades")}</Text>
        </ParchmentPanel>
      </View>

      {/* Content area */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Climbing Style */}
        <Text style={styles.sectionLabel}>Climbing Style</Text>
        <View style={styles.chipRow}>
          {([...CLIMBING_STYLES, "All"] as const).map((style) => {
            const isActive =
              style === "All"
                ? selectedStyles.size === CLIMBING_STYLES.length
                : selectedStyles.has(style);
            return (
              <Pressable
                key={style}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => toggleStyle(style)}
              >
                <Text
                  style={[
                    styles.chipText,
                    isActive && styles.chipTextActive,
                  ]}
                >
                  {style}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Route Grade Range */}
        <Text style={styles.sectionLabel}>Route Grade Range (YDS)</Text>
        <View style={styles.gradePickerRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.gradeScrollContent}
          >
            {ydsGrades.map((grade) => {
              const isMin = grade === routeMin;
              const isMax = grade === routeMax;
              const minIdx = ydsGrades.indexOf(routeMin);
              const maxIdx = ydsGrades.indexOf(routeMax);
              const gradeIdx = ydsGrades.indexOf(grade);
              const inRange = gradeIdx >= minIdx && gradeIdx <= maxIdx;
              return (
                <Pressable
                  key={grade}
                  style={[
                    styles.gradeChip,
                    inRange && styles.gradeChipInRange,
                    (isMin || isMax) && styles.gradeChipEndpoint,
                  ]}
                  onPress={() => {
                    if (gradeIdx <= ydsGrades.indexOf(routeMax)) {
                      setRouteMin(grade);
                    } else {
                      setRouteMax(grade);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.gradeChipText,
                      inRange && styles.gradeChipTextInRange,
                    ]}
                  >
                    {grade}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
        <Text style={styles.gradeHint}>
          Tap your lowest, then your highest
        </Text>

        {/* Boulder Grade Range */}
        <Text style={styles.sectionLabel}>Boulder Grade Range (V-scale)</Text>
        <View style={styles.gradePickerRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.gradeScrollContent}
          >
            {vGrades.map((grade) => {
              const isMin = grade === boulderMin;
              const isMax = grade === boulderMax;
              const minIdx = vGrades.indexOf(boulderMin);
              const maxIdx = vGrades.indexOf(boulderMax);
              const gradeIdx = vGrades.indexOf(grade);
              const inRange = gradeIdx >= minIdx && gradeIdx <= maxIdx;
              return (
                <Pressable
                  key={grade}
                  style={[
                    styles.gradeChip,
                    inRange && styles.gradeChipInRange,
                    (isMin || isMax) && styles.gradeChipEndpoint,
                  ]}
                  onPress={() => {
                    if (gradeIdx <= vGrades.indexOf(boulderMax)) {
                      setBoulderMin(grade);
                    } else {
                      setBoulderMax(grade);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.gradeChipText,
                      inRange && styles.gradeChipTextInRange,
                    ]}
                  >
                    {grade}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
        <Text style={styles.gradeHint}>
          Tap your lowest, then your highest
        </Text>

        {/* Years Climbing */}
        <Text style={styles.sectionLabel}>How long have you climbed?</Text>
        <View style={styles.chipRow}>
          {YEARS_OPTIONS.map((option) => (
            <Pressable
              key={option}
              style={[
                styles.chip,
                yearsClimbing === option && styles.chipActive,
              ]}
              onPress={() => setYearsClimbing(option)}
            >
              <Text
                style={[
                  styles.chipText,
                  yearsClimbing === option && styles.chipTextActive,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Continue */}
        <View style={{ opacity: canContinue ? 1 : 0.4, marginTop: 32 }}>
          <StoneButton label="Continue" onPress={handleContinue} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  // ─── Wizard Area ──────────────────────────────────────
  wizardArea: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  speechBubble: {
    maxWidth: "90%",
    position: "relative",
  },
  speechTail: {
    position: "absolute",
    top: -8,
    alignSelf: "center",
    left: "50%",
    marginLeft: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#5a4230",
  },
  speechText: {
    fontFamily: "VT323",
    color: COLORS.bg,
    fontSize: 18,
    lineHeight: 24,
    textAlign: "center",
  },
  // ─── Content Area ─────────────────────────────────────
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontFamily: "VT323",
    color: COLORS.primary,
    fontSize: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 4,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontFamily: "VT323",
    color: COLORS.text,
    fontSize: 18,
  },
  chipTextActive: {
    color: COLORS.bg,
  },
  // ─── Grade Picker ─────────────────────────────────────
  gradePickerRow: {
    height: 48,
  },
  gradeScrollContent: {
    alignItems: "center",
    gap: 6,
    paddingRight: 16,
  },
  gradeChip: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  gradeChipInRange: {
    backgroundColor: COLORS.primary + "33",
    borderColor: COLORS.primary,
  },
  gradeChipEndpoint: {
    backgroundColor: COLORS.primary,
  },
  gradeChipText: {
    fontFamily: "VT323",
    color: COLORS.muted,
    fontSize: 14,
  },
  gradeChipTextInRange: {
    color: COLORS.text,
  },
  gradeHint: {
    fontFamily: "VT323",
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 6,
  },
});
