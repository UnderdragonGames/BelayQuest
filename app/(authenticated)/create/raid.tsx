import { useState, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { t } from "@/lib/copy/en";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";

type Step = "gym" | "time" | "invite" | "confirm";
const STEPS: Step[] = ["gym", "time", "invite", "confirm"];

function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sinLon * sinLon;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function formatDistance(km: number): string {
  const miles = km * 0.621371;
  if (miles < 0.1) return "< 0.1 mi";
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

const COLORS = {
  bg: "#1a1a2e",
  primary: "#f4a261",
  text: "#eaeaea",
  muted: "#666680",
  card: "#16213e",
  border: "#2a2a4a",
  cardSelected: "#2a3a5e",
};

export default function CreateRaidScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    quickRaidSessionId?: string;
    quickRaidGymName?: string;
    quickRaidScheduledAt?: string;
    quickRaidGuildName?: string;
    quickRaidInvitedMembers?: string;
  }>();

  // If coming from quick raid, jump straight to confirm
  const isQuickRaid = !!params.quickRaidSessionId;

  const [step, setStep] = useState<Step>(isQuickRaid ? "confirm" : "gym");
  const [selectedGymId, setSelectedGymId] = useState<Id<"gyms"> | null>(null);
  const [selectedGymName, setSelectedGymName] = useState<string>("");
  const [scheduledAt, setScheduledAt] = useState<Date>(() => {
    if (params.quickRaidScheduledAt) {
      return new Date(Number(params.quickRaidScheduledAt));
    }
    const d = new Date();
    d.setHours(18, 0, 0, 0);
    if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
    return d;
  });
  const [datePickerMode, setDatePickerMode] = useState<"date" | "time">(
    "date"
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedGuildIds, setSelectedGuildIds] = useState<Id<"guilds">[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Id<"users">[]>([]);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gymSearch, setGymSearch] = useState("");
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locating, setLocating] = useState(false);

  const favoriteGyms = useQuery(api.gyms.myFavorites);
  const allGyms = useQuery(api.gyms.listAll);
  const searchResults = useQuery(
    api.gyms.search,
    gymSearch.trim().length > 0 ? { query: gymSearch.trim() } : "skip"
  );
  const guilds = useQuery(api.connections.myGuilds);
  const connections = useQuery(api.connections.myConnections);

  const handleLocate = useCallback(async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocating(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch {
      // Permission denied or location unavailable
    } finally {
      setLocating(false);
    }
  }, []);

  const createRaid = useMutation(api.sessions.createRaid);
  const confirmRaid = useMutation(api.sessions.confirmRaid);

  const stepIndex = STEPS.indexOf(step);

  const goNext = useCallback(() => {
    const nextIdx = stepIndex + 1;
    if (nextIdx < STEPS.length) {
      setStep(STEPS[nextIdx]);
    }
  }, [stepIndex]);

  const goBack = useCallback(() => {
    if (isQuickRaid && step === "confirm") {
      router.back();
      return;
    }
    const prevIdx = stepIndex - 1;
    if (prevIdx >= 0) {
      setStep(STEPS[prevIdx]);
    } else {
      router.back();
    }
  }, [stepIndex, isQuickRaid, step, router]);

  const canGoNext = useCallback(() => {
    switch (step) {
      case "gym":
        return selectedGymId !== null;
      case "time":
        return true;
      case "invite":
        return true; // Solo raids are allowed
      default:
        return false;
    }
  }, [step, selectedGymId, selectedGuildIds, selectedUserIds]);

  const toggleGuild = useCallback(
    (guildId: Id<"guilds">) => {
      setSelectedGuildIds((prev) =>
        prev.includes(guildId)
          ? prev.filter((id) => id !== guildId)
          : [...prev, guildId]
      );

      // Also toggle individual members from that guild
      const guild = guilds?.find((g) => g._id === guildId);
      if (guild) {
        const memberIds = guild.members.map((m) => m.userId);
        setSelectedUserIds((prev) => {
          const isSelected = selectedGuildIds.includes(guildId);
          if (isSelected) {
            // Removing guild: remove its members
            return prev.filter((id) => !memberIds.includes(id));
          } else {
            // Adding guild: add its members
            const newIds = new Set([...prev, ...memberIds]);
            return Array.from(newIds) as Id<"users">[];
          }
        });
      }
    },
    [guilds, selectedGuildIds]
  );

  const toggleUser = useCallback((userId: Id<"users">) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  }, []);

  const handleConfirm = useCallback(async () => {
    setIsSubmitting(true);
    try {
      if (isQuickRaid) {
        // Quick raid already created the session, just confirm
        await confirmRaid({
          sessionId: params.quickRaidSessionId as Id<"sessions">,
        });
        router.replace({
          pathname: "/session/[id]",
          params: { id: params.quickRaidSessionId! },
        });
      } else {
        const sessionId = await createRaid({
          gymId: selectedGymId!,
          scheduledAt: scheduledAt.getTime(),
          note: note || undefined,
          inviteUserIds: selectedUserIds,
          inviteGuildIds: selectedGuildIds,
        });
        await confirmRaid({ sessionId });
        router.replace({
          pathname: "/session/[id]",
          params: { id: sessionId },
        });
      }
    } catch (error) {
      // Let the error surface
      setIsSubmitting(false);
      throw error;
    }
  }, [
    isQuickRaid,
    params,
    selectedGymId,
    scheduledAt,
    note,
    selectedUserIds,
    selectedGuildIds,
    createRaid,
    confirmRaid,
    router,
  ]);

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

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  const formatDate = (date: Date) =>
    date.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  const isToday = (date: Date) => {
    const now = new Date();
    return date.toDateString() === now.toDateString();
  };

  const isTomorrow = (date: Date) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
  };

  // Quick raid pre-filled members
  const quickRaidMembers = params.quickRaidInvitedMembers
    ? JSON.parse(params.quickRaidInvitedMembers)
    : [];

  // ─── Gym sorting by distance ──────────────────────────────
  const isSearching = gymSearch.trim().length > 0;
  const hasFavorites = favoriteGyms && favoriteGyms.length > 0;

  const gymsToShow = useMemo(() => {
    // Priority: search results > location-sorted all gyms > favorites > empty
    let pool: typeof allGyms;
    if (isSearching) {
      pool = searchResults ?? [];
    } else if (userLocation && allGyms) {
      pool = allGyms;
    } else if (hasFavorites) {
      pool = favoriteGyms!;
    } else {
      pool = allGyms ?? [];
    }

    if (!userLocation || pool.length === 0) return pool.slice(0, 10);
    return [...pool]
      .sort((a, b) => haversineKm(userLocation, a) - haversineKm(userLocation, b))
      .slice(0, 10);
  }, [isSearching, searchResults, allGyms, favoriteGyms, hasFavorites, userLocation]);

  // ─── Step Renderers ──────────────────────────────────────

  const renderGymStep = () => {

    return (
      <ScrollView style={styles.stepContent} contentContainerStyle={styles.stepContentContainer}>
        <Text style={styles.stepTitle}>{t("raid.step.gym")}</Text>

        <View style={styles.gymSearchRow}>
          <TextInput
            style={styles.gymSearchInput}
            placeholder="Search gyms..."
            placeholderTextColor={COLORS.muted}
            value={gymSearch}
            onChangeText={setGymSearch}
            autoCorrect={false}
          />
          <Pressable
            style={[
              styles.locateButton,
              userLocation && styles.locateButtonActive,
            ]}
            onPress={handleLocate}
            disabled={locating}
          >
            {locating ? (
              <ActivityIndicator color={COLORS.primary} size="small" />
            ) : (
              <Text
                style={[
                  styles.locateIcon,
                  userLocation && styles.locateIconActive,
                ]}
              >
                ◎
              </Text>
            )}
          </Pressable>
        </View>

        {!isSearching && userLocation && (
          <Text style={styles.sectionLabel}>Nearby</Text>
        )}
        {!isSearching && !userLocation && hasFavorites && (
          <Text style={styles.sectionLabel}>Favorites</Text>
        )}

        {isSearching && searchResults === undefined ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : gymsToShow.length === 0 ? (
          <Text style={styles.emptyText}>
            {isSearching
              ? "No gyms found"
              : "Tap the locate button or search for a gym"}
          </Text>
        ) : (
          gymsToShow.map((gym) => {
            const dist = userLocation ? haversineKm(userLocation, gym) : null;
            return (
              <Pressable
                key={gym._id}
                style={[
                  styles.gymCard,
                  selectedGymId === gym._id && styles.gymCardSelected,
                ]}
                onPress={() => {
                  setSelectedGymId(gym._id);
                  setSelectedGymName(gym.name);
                  setStep("time");
                }}
              >
                <View style={styles.gymCardHeader}>
                  <Text style={[styles.gymName, { flex: 1 }]}>{gym.name}</Text>
                  {dist !== null && (
                    <Text style={styles.gymDistance}>
                      {formatDistance(dist)}
                    </Text>
                  )}
                </View>
                <Text style={styles.gymAddress}>
                  {gym.address ? `${gym.address}, ` : ""}{gym.city}, {gym.state}
                </Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    );
  };

  const renderTimeStep = () => (
    <ScrollView style={styles.stepContent} contentContainerStyle={styles.stepContentContainer}>
      <Text style={styles.stepTitle}>{t("raid.step.time")}</Text>

      <View style={styles.dayRow}>
        <Pressable
          style={[styles.dayChip, isToday(scheduledAt) && styles.dayChipSelected]}
          onPress={setToday}
        >
          <Text
            style={[
              styles.dayChipText,
              isToday(scheduledAt) && styles.dayChipTextSelected,
            ]}
          >
            {t("raid.time.today")}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.dayChip, isTomorrow(scheduledAt) && styles.dayChipSelected]}
          onPress={setTomorrow}
        >
          <Text
            style={[
              styles.dayChipText,
              isTomorrow(scheduledAt) && styles.dayChipTextSelected,
            ]}
          >
            {t("raid.time.tomorrow")}
          </Text>
        </Pressable>
        <Pressable
          style={styles.dayChip}
          onPress={() => {
            setDatePickerMode("date");
            setShowDatePicker(true);
          }}
        >
          <Text style={styles.dayChipText}>{t("raid.time.pick_date")}</Text>
        </Pressable>
      </View>

      <Text style={styles.selectedDateText}>{formatDate(scheduledAt)}</Text>

      <Text style={styles.timeLabel}>Time</Text>
      <Pressable
        style={styles.timeButton}
        onPress={() => {
          setDatePickerMode("time");
          setShowDatePicker(true);
        }}
      >
        <Text style={styles.timeButtonText}>{formatTime(scheduledAt)}</Text>
      </Pressable>

      {showDatePicker && (
        <DateTimePicker
          value={scheduledAt}
          mode={datePickerMode}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          themeVariant="dark"
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

  const renderInviteStep = () => (
    <ScrollView style={styles.stepContent} contentContainerStyle={styles.stepContentContainer}>
      <Text style={styles.stepTitle}>{t("raid.step.invite")}</Text>

      {guilds && guilds.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>{t("raid.invite.guilds")}</Text>
          <View style={styles.guildRow}>
            {guilds.map((guild) => (
              <Pressable
                key={guild._id}
                style={[
                  styles.guildChip,
                  selectedGuildIds.includes(guild._id) &&
                    styles.guildChipSelected,
                ]}
                onPress={() => toggleGuild(guild._id)}
              >
                <Text
                  style={[
                    styles.guildChipText,
                    selectedGuildIds.includes(guild._id) &&
                      styles.guildChipTextSelected,
                  ]}
                >
                  {guild.name} ({guild.members.length})
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {connections && connections.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>{t("raid.invite.connections")}</Text>
          {connections.map((conn) => (
            <Pressable
              key={conn._id}
              style={[
                styles.connectionRow,
                selectedUserIds.includes(conn.connectedUserId) &&
                  styles.connectionRowSelected,
              ]}
              onPress={() => toggleUser(conn.connectedUserId)}
            >
              <View style={styles.connectionInfo}>
                <Text style={styles.connectionName}>
                  {conn.nickname ?? conn.generatedName}
                </Text>
                {conn.nickname && (
                  <Text style={styles.connectionSubname}>
                    {conn.generatedName}
                  </Text>
                )}
              </View>
              <Text style={styles.connectionLevel}>Lv.{conn.level}</Text>
              <View
                style={[
                  styles.checkbox,
                  selectedUserIds.includes(conn.connectedUserId) &&
                    styles.checkboxChecked,
                ]}
              >
                {selectedUserIds.includes(conn.connectedUserId) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
            </Pressable>
          ))}
        </>
      )}

      <Pressable style={styles.addPhoneButton}>
        <Text style={styles.addPhoneText}>{t("raid.invite.add_phone")}</Text>
      </Pressable>

      {selectedGuildIds.length === 0 && selectedUserIds.length === 0 && (
        <Text style={styles.emptyInviteText}>
          No one selected — you can still go solo!
        </Text>
      )}
    </ScrollView>
  );

  const renderConfirmStep = () => {
    const displayGymName = isQuickRaid
      ? params.quickRaidGymName ?? ""
      : selectedGymName;
    const displayDate = scheduledAt;
    const displayGuildName = isQuickRaid
      ? params.quickRaidGuildName
      : undefined;

    // Gather invited member names for display
    let invitedNames: string[] = [];
    if (isQuickRaid && quickRaidMembers.length > 0) {
      invitedNames = quickRaidMembers.map(
        (m: { nickname?: string; generatedName: string }) =>
          m.nickname ?? m.generatedName
      );
    } else {
      // Combine guild members + individual selections
      const allSelectedUserIds = new Set(
        selectedUserIds.map((id) => id.toString())
      );
      for (const guildId of selectedGuildIds) {
        const guild = guilds?.find((g) => g._id === guildId);
        if (guild) {
          for (const m of guild.members) {
            allSelectedUserIds.add(m.userId.toString());
          }
        }
      }
      // Get names from connections and guild members
      for (const uid of allSelectedUserIds) {
        const conn = connections?.find(
          (c) => c.connectedUserId.toString() === uid
        );
        if (conn) {
          invitedNames.push(conn.nickname ?? conn.generatedName ?? "Unknown");
        } else {
          // Check guild members
          for (const guild of guilds ?? []) {
            const member = guild.members.find(
              (m) => m.userId.toString() === uid
            );
            if (member) {
              invitedNames.push(member.nickname ?? member.generatedName ?? "Unknown");
              break;
            }
          }
        }
      }
    }

    return (
      <ScrollView style={styles.stepContent} contentContainerStyle={styles.stepContentContainer}>
        <Text style={styles.stepTitle}>{t("raid.step.confirm")}</Text>

        <View style={styles.confirmCard}>
          <Text style={styles.confirmIcon}>⚔</Text>

          <Text style={styles.confirmLabel}>{t("raid.confirm.gym")}</Text>
          <Text style={styles.confirmValue}>{displayGymName}</Text>

          <Text style={styles.confirmLabel}>{t("raid.confirm.time")}</Text>
          <Text style={styles.confirmValue}>
            {formatDate(displayDate)} at {formatTime(displayDate)}
          </Text>

          {displayGuildName && (
            <>
              <Text style={styles.confirmLabel}>Guild</Text>
              <Text style={styles.confirmValue}>{displayGuildName}</Text>
            </>
          )}

          <Text style={styles.confirmLabel}>{t("raid.confirm.party")}</Text>
          {invitedNames.length > 0 ? (
            <>
              <Text style={styles.confirmValue}>
                {t("raid.confirm.members_count", {
                  count: invitedNames.length + 1,
                })}
              </Text>
              {invitedNames.map((name, idx) => (
                <Text key={idx} style={styles.memberName}>
                  {name}
                </Text>
              ))}
            </>
          ) : (
            <Text style={styles.confirmValue}>Just you (for now)</Text>
          )}
        </View>

        {!isQuickRaid && (
          <TextInput
            style={styles.noteInput}
            placeholder={t("raid.confirm.note_placeholder")}
            placeholderTextColor={COLORS.muted}
            value={note}
            onChangeText={setNote}
            multiline
          />
        )}

        <Pressable
          style={[styles.confirmButton, isSubmitting && styles.buttonDisabled]}
          onPress={handleConfirm}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={COLORS.bg} />
          ) : (
            <Text style={styles.confirmButtonText}>
              {t("raid.confirm.send")}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    );
  };

  const renderStep = () => {
    switch (step) {
      case "gym":
        return renderGymStep();
      case "time":
        return renderTimeStep();
      case "invite":
        return renderInviteStep();
      case "confirm":
        return renderConfirmStep();
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress indicator */}
      <View style={styles.progressRow}>
        {STEPS.map((s, i) => (
          <View
            key={s}
            style={[
              styles.progressDot,
              i <= stepIndex && styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      {renderStep()}

      {/* Navigation buttons */}
      {step !== "confirm" && (
        <View style={styles.navRow}>
          <Pressable style={styles.navButton} onPress={goBack}>
            <Text style={styles.navButtonText}>{t("raid.step.back")}</Text>
          </Pressable>
          <Pressable
            style={[
              styles.navButton,
              styles.navButtonPrimary,
              !canGoNext() && styles.buttonDisabled,
            ]}
            onPress={goNext}
            disabled={!canGoNext()}
          >
            <Text style={styles.navButtonPrimaryText}>
              {t("raid.step.next")}
            </Text>
          </Pressable>
        </View>
      )}

      {step === "confirm" && (
        <View style={styles.navRow}>
          <Pressable style={styles.navButton} onPress={goBack}>
            <Text style={styles.navButtonText}>{t("raid.step.back")}</Text>
          </Pressable>
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
  progressRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    gap: 8,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.border,
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
  },
  stepContent: {
    flex: 1,
  },
  stepContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 20,
  },
  // Gym step
  gymSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  gymSearchInput: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    color: COLORS.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  locateButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  locateButtonActive: {
    borderColor: COLORS.primary,
  },
  locateIcon: {
    fontSize: 22,
    color: COLORS.muted,
  },
  locateIconActive: {
    color: COLORS.primary,
  },
  gymCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  gymDistance: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
    marginLeft: 8,
  },
  gymCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  gymCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.cardSelected,
  },
  gymName: {
    fontSize: 17,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  gymAddress: {
    fontSize: 13,
    color: COLORS.muted,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 40,
  },
  // Time step
  dayRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  dayChip: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dayChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.cardSelected,
  },
  dayChipText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "600",
  },
  dayChipTextSelected: {
    color: COLORS.primary,
  },
  selectedDateText: {
    fontSize: 18,
    color: COLORS.text,
    fontWeight: "bold",
    marginBottom: 24,
  },
  timeLabel: {
    fontSize: 14,
    color: COLORS.muted,
    marginBottom: 8,
  },
  timeButton: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignSelf: "flex-start",
  },
  timeButtonText: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  // Invite step
  sectionLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 8,
  },
  guildRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  guildChip: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  guildChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.cardSelected,
  },
  guildChipText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "600",
  },
  guildChipTextSelected: {
    color: COLORS.primary,
  },
  connectionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  connectionRowSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.cardSelected,
  },
  connectionInfo: {
    flex: 1,
  },
  connectionName: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.text,
  },
  connectionSubname: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  connectionLevel: {
    fontSize: 13,
    color: COLORS.muted,
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.bg,
    fontSize: 14,
    fontWeight: "bold",
  },
  addPhoneButton: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
  },
  addPhoneText: {
    fontSize: 14,
    color: COLORS.muted,
  },
  emptyInviteText: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 20,
  },
  // Confirm step
  confirmCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  confirmIcon: {
    fontSize: 36,
    textAlign: "center",
    marginBottom: 16,
  },
  confirmLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 4,
  },
  confirmValue: {
    fontSize: 17,
    color: COLORS.text,
    fontWeight: "600",
  },
  memberName: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 4,
    paddingLeft: 8,
  },
  noteInput: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    color: COLORS.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    minHeight: 60,
    textAlignVertical: "top",
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.bg,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  // Navigation
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  navButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  navButtonPrimary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  navButtonPrimaryText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.bg,
  },
});
