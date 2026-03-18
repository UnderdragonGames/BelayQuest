import { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { t } from "@/lib/copy/en";
import { allGrades } from "@/lib/grades/parser";
import { COLORS } from "@/lib/theme";
import { ParchmentPanel } from "@/components/ParchmentPanel";
import { SectionHeader } from "@/components/SectionHeader";
import { StoneButton } from "@/components/StoneButton";
import { PixelIcon } from "@/components/PixelIcon";
import type { IconName } from "@/assets/images/icons";
import DateTimePicker from "@react-native-community/datetimepicker";

type Step = "gym" | "time" | "details" | "confirm";
const STEPS: Step[] = ["gym", "time", "details", "confirm"];

const STEP_ICONS: Record<Step, IconName> = {
  gym: "magnifier",
  time: "hourglass",
  details: "scroll",
  confirm: "flag",
};

const STEP_LABELS: Record<Step, string> = {
  gym: "GYM",
  time: "TIME",
  details: "QUEST",
  confirm: "POST",
};

const CLIMBING_TYPES = [
  { value: "boulder", label: "Boulder", icon: "boulder" as IconName },
  { value: "lead", label: "Lead", icon: "rope" as IconName },
  { value: "top_rope", label: "Top Rope", icon: "rope" as IconName },
];

const CAPACITIES = [2, 3, 4, 5, 6, 7, 8];

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: Step }) {
  const currentIdx = STEPS.indexOf(currentStep);
  return (
    <View style={stepStyles.row}>
      {STEPS.map((s, i) => {
        const isActive = i === currentIdx;
        const isPast = i < currentIdx;
        return (
          <View key={s} style={stepStyles.stepWrapper}>
            {i > 0 && (
              <View
                style={[
                  stepStyles.connector,
                  i <= currentIdx && stepStyles.connectorActive,
                ]}
              />
            )}
            <View
              style={[
                stepStyles.iconBox,
                isActive && stepStyles.iconBoxActive,
                isPast && stepStyles.iconBoxPast,
              ]}
            >
              {isPast ? (
                <PixelIcon name="checkmark" size={20} />
              ) : (
                <PixelIcon
                  name={STEP_ICONS[s]}
                  size={20}
                  style={[
                    stepStyles.icon,
                    !isActive && stepStyles.iconMuted,
                  ]}
                />
              )}
            </View>
            <Text
              style={[
                stepStyles.label,
                isActive && stepStyles.labelActive,
              ]}
            >
              {STEP_LABELS[s]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  stepWrapper: {
    alignItems: "center",
    flex: 1,
    position: "relative",
  },
  connector: {
    position: "absolute",
    top: 14,
    right: "50%",
    left: "-50%",
    height: 2,
    backgroundColor: COLORS.border,
  },
  connectorActive: {
    backgroundColor: COLORS.primary,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 2,
    zIndex: 1,
  },
  iconBoxActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.cardSelected,
  },
  iconBoxPast: {
    borderColor: COLORS.xp,
    backgroundColor: "#1e3828",
  },
  icon: {},
  iconMuted: {
    opacity: 0.4,
  },
  label: {
    fontFamily: "VT323",
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 4,
    letterSpacing: 1,
  },
  labelActive: {
    color: COLORS.primary,
  },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function CreateQuestScreen() {
  const router = useRouter();
  const { bottom: bottomInset } = useSafeAreaInsets();

  const [step, setStep] = useState<Step>("gym");
  const [selectedGymId, setSelectedGymId] = useState<Id<"gyms"> | null>(null);
  const [selectedGymName, setSelectedGymName] = useState<string>("");
  const [scheduledAt, setScheduledAt] = useState<Date>(() => {
    const d = new Date();
    d.setHours(18, 0, 0, 0);
    if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
    return d;
  });
  const [datePickerMode, setDatePickerMode] = useState<"date" | "time">("date");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [capacity, setCapacity] = useState(4);
  const [climbingType, setClimbingType] = useState<string>("boulder");
  const [gradeSystem, setGradeSystem] = useState<"v_scale" | "yds">("v_scale");
  const [gradeMin, setGradeMin] = useState<string>("V3");
  const [gradeMax, setGradeMax] = useState<string>("V7");
  const [checkInMessage, setCheckInMessage] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [gymSearch, setGymSearch] = useState("");

  const favoriteGymsResult = useQuery(api.gyms.myFavorites);
  const favoriteGyms = favoriteGymsResult ?? [];
  const searchResults = useQuery(
    api.gyms.search,
    gymSearch.trim().length > 0 ? { query: gymSearch.trim() } : "skip"
  );
  const createQuest = useMutation(api.sessions.createQuest);

  const grades = allGrades(gradeSystem);
  const stepIndex = STEPS.indexOf(step);

  const handleClimbingTypeChange = (type: string) => {
    setClimbingType(type);
    if (type === "boulder") {
      setGradeSystem("v_scale");
      setGradeMin("V3");
      setGradeMax("V7");
    } else {
      setGradeSystem("yds");
      setGradeMin("5.9");
      setGradeMax("5.11b");
    }
  };

  const handleSubmit = async () => {
    if (!selectedGymId) return;
    setSubmitting(true);
    try {
      const result = await createQuest({
        gymId: selectedGymId,
        scheduledAt: scheduledAt.getTime(),
        capacity,
        climbingType,
        gradeRange: { min: gradeMin, max: gradeMax },
        checkInMessage: checkInMessage.trim() || undefined,
      });
      router.replace({
        pathname: "/session/[id]",
        params: { id: result.sessionId },
      });
    } catch (err: any) {
      alert(err?.message ?? "Failed to post quest");
      setSubmitting(false);
    }
  };

  const goNext = useCallback(() => {
    const nextIdx = stepIndex + 1;
    if (nextIdx < STEPS.length) setStep(STEPS[nextIdx]);
  }, [stepIndex]);

  const goBack = useCallback(() => {
    const prevIdx = stepIndex - 1;
    if (prevIdx >= 0) setStep(STEPS[prevIdx]);
    else router.back();
  }, [stepIndex, router]);

  const canGoNext = useCallback(() => {
    switch (step) {
      case "gym":
        return selectedGymId !== null;
      case "time":
        return true;
      case "details":
        return true;
      default:
        return false;
    }
  }, [step, selectedGymId]);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  const formatDate = (d: Date) =>
    d.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  const isToday = (d: Date) => d.toDateString() === new Date().toDateString();

  const isTomorrow = (d: Date) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return d.toDateString() === tomorrow.toDateString();
  };

  const setToday = useCallback(() => {
    const d = new Date();
    d.setHours(scheduledAt.getHours(), scheduledAt.getMinutes(), 0, 0);
    setScheduledAt(d);
  }, [scheduledAt]);

  const setTomorrow = useCallback(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(scheduledAt.getHours(), scheduledAt.getMinutes(), 0, 0);
    setScheduledAt(d);
  }, [scheduledAt]);

  // ─── Step Renderers ──────────────────────────────────────────────────────────

  const isSearching = gymSearch.trim().length > 0;
  const favoriteIds = new Set(favoriteGyms.map((g) => g._id));
  // When searching, filter out duplicates that are already in favorites
  const filteredSearchResults = (searchResults ?? []).filter(
    (g) => !favoriteIds.has(g._id)
  );

  const renderGymCard = (gym: { _id: Id<"gyms">; name: string; city?: string }, isFav?: boolean) => {
    const isSelected = selectedGymId === gym._id;
    return (
      <Pressable
        key={gym._id}
        style={[styles.gymCard, isSelected && styles.gymCardSelected]}
        onPress={() => {
          setSelectedGymId(gym._id);
          setSelectedGymName(gym.name);
          setStep("time");
        }}
      >
        <View style={styles.gymCardInner}>
          <PixelIcon name="boulder" size={24} />
          <View style={styles.gymInfo}>
            <Text style={[styles.gymName, isSelected && styles.gymNameSelected]}>
              {gym.name}
            </Text>
            {gym.city && (
              <Text style={styles.gymAddress}>{gym.city}</Text>
            )}
          </View>
          {isFav && <PixelIcon name="star" size={16} style={{ opacity: 0.5 }} />}
          {isSelected && <PixelIcon name="checkmark" size={20} />}
        </View>
      </Pressable>
    );
  };

  const renderGymStep = () => (
    <ScrollView style={styles.stepContent} contentContainerStyle={styles.stepContentContainer}>
      <SectionHeader title="Choose Your Dungeon" />

      <TextInput
        style={styles.gymSearchInput}
        placeholder="Search all gyms..."
        placeholderTextColor={COLORS.muted}
        value={gymSearch}
        onChangeText={setGymSearch}
        autoCorrect={false}
        returnKeyType="search"
      />

      {favoriteGymsResult === undefined ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : isSearching ? (
        <>
          {/* Show matching favorites first */}
          {favoriteGyms
            .filter((g) => g.name.toLowerCase().includes(gymSearch.trim().toLowerCase()))
            .map((gym) => renderGymCard(gym, true))}
          {/* Then search results (excluding favorites) */}
          {searchResults === undefined ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : filteredSearchResults.length === 0 && favoriteGyms.filter((g) => g.name.toLowerCase().includes(gymSearch.trim().toLowerCase())).length === 0 ? (
            <Text style={[styles.emptySubtext, { textAlign: "center", marginTop: 20 }]}>
              No gyms found for "{gymSearch.trim()}"
            </Text>
          ) : (
            filteredSearchResults.map((gym) => renderGymCard(gym))
          )}
        </>
      ) : (
        <>
          {favoriteGyms.length > 0 && (
            <>
              <Text style={styles.gymSectionLabel}>Favorites</Text>
              {favoriteGyms.map((gym) => renderGymCard(gym, true))}
            </>
          )}
          {favoriteGyms.length === 0 && (
            <Text style={[styles.emptySubtext, { textAlign: "center", marginTop: 20 }]}>
              Search above to find your gym.
            </Text>
          )}
        </>
      )}
    </ScrollView>
  );

  const renderTimeStep = () => (
    <ScrollView style={styles.stepContent} contentContainerStyle={styles.stepContentContainer}>
      <SectionHeader title="Set the Hour" />

      <Text style={styles.sectionLabel}>When should adventurers arrive?</Text>

      <View style={styles.dayRow}>
        <Pressable
          style={[styles.dayChip, isToday(scheduledAt) && styles.dayChipSelected]}
          onPress={setToday}
        >
          <Text style={[styles.dayChipText, isToday(scheduledAt) && styles.dayChipTextSelected]}>
            Today
          </Text>
        </Pressable>
        <Pressable
          style={[styles.dayChip, isTomorrow(scheduledAt) && styles.dayChipSelected]}
          onPress={setTomorrow}
        >
          <Text style={[styles.dayChipText, isTomorrow(scheduledAt) && styles.dayChipTextSelected]}>
            Tomorrow
          </Text>
        </Pressable>
        <Pressable
          style={styles.dayChip}
          onPress={() => {
            setDatePickerMode("date");
            setShowDatePicker(true);
          }}
        >
          <Text style={styles.dayChipText}>Pick Date</Text>
        </Pressable>
      </View>

      <ParchmentPanel style={styles.dateDisplay}>
        <Text style={styles.selectedDateText}>{formatDate(scheduledAt)}</Text>
      </ParchmentPanel>

      <Text style={styles.sectionLabel}>
        <PixelIcon name="hourglass" size={14} /> TIME
      </Text>
      <Pressable
        style={styles.timeButton}
        onPress={() => {
          setDatePickerMode("time");
          setShowDatePicker(true);
        }}
      >
        <ParchmentPanel>
          <Text style={styles.timeButtonText}>{formatTime(scheduledAt)}</Text>
        </ParchmentPanel>
      </Pressable>

      {showDatePicker && (
        <DateTimePicker
          value={scheduledAt}
          mode={datePickerMode}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          themeVariant="dark"
          minimumDate={new Date()}
          onChange={(_event, date) => {
            setShowDatePicker(Platform.OS === "ios");
            if (date) {
              if (datePickerMode === "date") {
                const newDate = new Date(date);
                newDate.setHours(
                  scheduledAt.getHours(),
                  scheduledAt.getMinutes(),
                  0,
                  0
                );
                setScheduledAt(newDate);
              } else {
                const newDate = new Date(scheduledAt);
                newDate.setHours(date.getHours(), date.getMinutes(), 0, 0);
                setScheduledAt(newDate);
              }
            }
          }}
        />
      )}
    </ScrollView>
  );

  const renderDetailsStep = () => (
    <ScrollView style={styles.stepContent} contentContainerStyle={styles.stepContentContainer}>
      <SectionHeader title="Quest Details" />

      <Text style={styles.sectionLabel}>Climbing Style</Text>
      <View style={styles.rowGroup}>
        {CLIMBING_TYPES.map((ct) => {
          const isActive = climbingType === ct.value;
          return (
            <Pressable
              key={ct.value}
              style={[styles.typeChip, isActive && styles.typeChipSelected]}
              onPress={() => handleClimbingTypeChange(ct.value)}
            >
              <PixelIcon name={ct.icon} size={18} style={!isActive ? { opacity: 0.5 } : undefined} />
              <Text style={[styles.typeChipText, isActive && styles.typeChipTextSelected]}>
                {ct.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>Grade Range</Text>
      <View style={styles.gradeRow}>
        <View style={styles.gradePickerWrapper}>
          <Text style={styles.gradePickerLabel}>MIN</Text>
          <ScrollView
            style={styles.gradePicker}
            showsVerticalScrollIndicator={false}
          >
            {grades.map((g) => {
              const isActive = gradeMin === g;
              return (
                <Pressable
                  key={g}
                  style={[styles.gradeOption, isActive && styles.gradeOptionSelected]}
                  onPress={() => setGradeMin(g)}
                >
                  <Text style={[styles.gradeOptionText, isActive && styles.gradeOptionTextSelected]}>
                    {g}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
        <Text style={styles.gradeRangeSep}>–</Text>
        <View style={styles.gradePickerWrapper}>
          <Text style={styles.gradePickerLabel}>MAX</Text>
          <ScrollView
            style={styles.gradePicker}
            showsVerticalScrollIndicator={false}
          >
            {grades.map((g) => {
              const isActive = gradeMax === g;
              return (
                <Pressable
                  key={g}
                  style={[styles.gradeOption, isActive && styles.gradeOptionSelected]}
                  onPress={() => setGradeMax(g)}
                >
                  <Text style={[styles.gradeOptionText, isActive && styles.gradeOptionTextSelected]}>
                    {g}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Party Size</Text>
      <View style={styles.rowGroup}>
        {CAPACITIES.map((cap) => {
          const isActive = capacity === cap;
          return (
            <Pressable
              key={cap}
              style={[styles.capacityChip, isActive && styles.capacityChipSelected]}
              onPress={() => setCapacity(cap)}
            >
              <Text style={[styles.capacityChipText, isActive && styles.capacityChipTextSelected]}>
                {cap}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.capacityHint}>max adventurers (including you)</Text>
    </ScrollView>
  );

  const renderConfirmStep = () => (
    <ScrollView style={styles.stepContent} contentContainerStyle={styles.stepContentContainer}>
      <SectionHeader title="Post to Quest Board" />

      <ParchmentPanel style={styles.confirmCard}>
        <View style={styles.confirmIconRow}>
          <PixelIcon name="scroll" size={40} />
        </View>

        <Text style={styles.confirmLabel}>Dungeon</Text>
        <Text style={styles.confirmValue}>{selectedGymName}</Text>

        <Text style={styles.confirmLabel}>Time</Text>
        <Text style={styles.confirmValue}>
          {formatDate(scheduledAt)} @ {formatTime(scheduledAt)}
        </Text>

        <Text style={styles.confirmLabel}>Style</Text>
        <Text style={styles.confirmValue}>
          {CLIMBING_TYPES.find((c) => c.value === climbingType)?.label ?? climbingType}
        </Text>

        <Text style={styles.confirmLabel}>Grades</Text>
        <Text style={styles.confirmValue}>
          {gradeMin} – {gradeMax}
        </Text>

        <Text style={styles.confirmLabel}>Party Size</Text>
        <Text style={styles.confirmValue}>Up to {capacity}</Text>
      </ParchmentPanel>

      <Text style={styles.sectionLabel}>Check-in Message (optional)</Text>
      <TextInput
        style={styles.noteInput}
        value={checkInMessage}
        onChangeText={setCheckInMessage}
        placeholder="Meet at the main wall..."
        placeholderTextColor={COLORS.muted}
        multiline
        maxLength={120}
      />

      <View style={[styles.confirmButtonWrapper, submitting && { opacity: 0.5 }]}>
        {submitting ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.loadingText}>Posting quest...</Text>
          </View>
        ) : (
          <StoneButton label={t("action.post_quest")} onPress={handleSubmit} />
        )}
      </View>
    </ScrollView>
  );

  const renderStep = () => {
    switch (step) {
      case "gym":     return renderGymStep();
      case "time":    return renderTimeStep();
      case "details": return renderDetailsStep();
      case "confirm": return renderConfirmStep();
    }
  };

  return (
    <View style={styles.container}>
      <StepIndicator currentStep={step} />

      {renderStep()}

      {step !== "confirm" && (
        <View style={[styles.navRow, { paddingBottom: Math.max(12, bottomInset) }]}>
          <StoneButton label="Back" onPress={goBack} style={{ flex: 1 }} />
          <View style={[{ flex: 1 }, !canGoNext() && { opacity: 0.4 }]}>
            <StoneButton label="Next" onPress={canGoNext() ? goNext : () => {}} style={{ alignSelf: "stretch" }} />
          </View>
        </View>
      )}

      {step === "confirm" && (
        <View style={[styles.navRow, { paddingBottom: Math.max(12, bottomInset) }]}>
          <StoneButton label="Back" onPress={goBack} style={{ flex: 1 }} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  stepContent: {
    flex: 1,
  },
  stepContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  // ─── Gym step ───────────────────────────────────────────────────────────────
  gymCard: {
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 2,
    marginBottom: 8,
    overflow: "hidden",
  },
  gymCardSelected: {
    borderColor: COLORS.primary,
  },
  gymCardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    gap: 10,
  },
  gymInfo: {
    flex: 1,
  },
  gymName: {
    fontFamily: "VT323",
    fontSize: 20,
    color: COLORS.text,
  },
  gymNameSelected: {
    color: COLORS.primary,
  },
  gymAddress: {
    fontFamily: "VT323",
    fontSize: 15,
    color: COLORS.muted,
  },
  gymSearchInput: {
    fontFamily: "VT323",
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 2,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 18,
    marginBottom: 12,
  },
  gymSectionLabel: {
    fontFamily: "VT323",
    fontSize: 14,
    color: COLORS.muted,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 6,
    marginTop: 4,
  },
  emptySubtext: {
    fontFamily: "VT323",
    fontSize: 16,
    color: COLORS.muted,
  },

  // ─── Time step ──────────────────────────────────────────────────────────────
  sectionLabel: {
    fontFamily: "VT323",
    fontSize: 16,
    color: COLORS.muted,
    letterSpacing: 2,
    marginBottom: 8,
    marginTop: 4,
  },
  dayRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  dayChip: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 2,
    paddingVertical: 10,
    alignItems: "center",
  },
  dayChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.cardSelected,
  },
  dayChipText: {
    fontFamily: "VT323",
    fontSize: 17,
    color: COLORS.text,
  },
  dayChipTextSelected: {
    color: COLORS.primary,
  },
  dateDisplay: {
    marginBottom: 16,
    alignSelf: "stretch",
  },
  selectedDateText: {
    fontFamily: "VT323",
    fontSize: 24,
    color: COLORS.bg,
    textAlign: "center",
  },
  timeButton: {
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  timeButtonText: {
    fontFamily: "VT323",
    fontSize: 36,
    color: COLORS.bg,
    letterSpacing: 2,
  },

  // ─── Details step ───────────────────────────────────────────────────────────
  rowGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    gap: 6,
  },
  typeChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.cardSelected,
  },
  typeChipText: {
    fontFamily: "VT323",
    fontSize: 18,
    color: COLORS.text,
  },
  typeChipTextSelected: {
    color: COLORS.primary,
  },
  gradeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
    height: 160,
  },
  gradePickerWrapper: {
    flex: 1,
    alignItems: "center",
  },
  gradePickerLabel: {
    fontFamily: "VT323",
    fontSize: 14,
    color: COLORS.muted,
    letterSpacing: 2,
    marginBottom: 6,
  },
  gradePicker: {
    flex: 1,
    width: "100%",
    backgroundColor: COLORS.card,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  gradeOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  gradeOptionSelected: {
    backgroundColor: COLORS.primary,
  },
  gradeOptionText: {
    fontFamily: "VT323",
    fontSize: 16,
    color: COLORS.muted,
  },
  gradeOptionTextSelected: {
    color: COLORS.bg,
  },
  gradeRangeSep: {
    fontFamily: "VT323",
    fontSize: 24,
    color: COLORS.muted,
  },
  capacityChip: {
    width: 44,
    height: 44,
    borderRadius: 2,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  capacityChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  capacityChipText: {
    fontFamily: "VT323",
    fontSize: 20,
    color: COLORS.muted,
  },
  capacityChipTextSelected: {
    color: COLORS.bg,
  },
  capacityHint: {
    fontFamily: "VT323",
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 4,
  },

  // ─── Confirm step ───────────────────────────────────────────────────────────
  confirmCard: {
    marginBottom: 14,
  },
  confirmIconRow: {
    alignItems: "center",
    marginBottom: 12,
  },
  confirmLabel: {
    fontFamily: "VT323",
    fontSize: 14,
    color: COLORS.bg,
    opacity: 0.6,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginTop: 10,
    marginBottom: 2,
  },
  confirmValue: {
    fontFamily: "VT323",
    fontSize: 22,
    color: COLORS.bg,
  },
  noteInput: {
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 2,
    padding: 12,
    color: COLORS.text,
    fontFamily: "VT323",
    fontSize: 18,
    marginBottom: 14,
    minHeight: 60,
    textAlignVertical: "top",
  },
  confirmButtonWrapper: {
    alignItems: "center",
    marginTop: 4,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
  },
  loadingText: {
    fontFamily: "VT323",
    fontSize: 20,
    color: COLORS.muted,
  },

  // ─── Navigation ─────────────────────────────────────────────────────────────
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderTopWidth: 2,
    borderTopColor: COLORS.border,
  },
});
