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
  Share,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AddPeopleModal, type AddedPerson } from "@/components/AddPeopleModal";
import { t } from "@/lib/copy/en";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
import { COLORS } from "@/lib/theme";
import { ParchmentPanel } from "@/components/ParchmentPanel";
import { StoneButton } from "@/components/StoneButton";
import { PixelIcon } from "@/components/PixelIcon";
import { SectionHeader } from "@/components/SectionHeader";
import type { IconName } from "@/assets/images/icons";

const itemSlot = require("@/assets/images/ui/ItemSlotStone.webp");

type Step = "gym" | "time" | "invite" | "confirm";
const STEPS: Step[] = ["gym", "time", "invite", "confirm"];

const STEP_ICONS: Record<Step, IconName> = {
  gym: "magnifier",
  time: "hourglass",
  invite: "handshake",
  confirm: "scroll",
};

const STEP_LABELS: Record<Step, string> = {
  gym: "GYM",
  time: "TIME",
  invite: "PARTY",
  confirm: "RAID",
};

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

export default function CreateRaidScreen() {
  const router = useRouter();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    quickRaidSessionId?: string;
    quickRaidShortCode?: string;
    quickRaidGymName?: string;
    quickRaidScheduledAt?: string;
    quickRaidGuildName?: string;
    quickRaidInvitedMembers?: string;
  }>();

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
  const [datePickerMode, setDatePickerMode] = useState<"date" | "time">("date");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedGuildIds, setSelectedGuildIds] = useState<Id<"guilds">[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Id<"users">[]>([]);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddPeople, setShowAddPeople] = useState(false);
  const [phoneInvites, setPhoneInvites] = useState<AddedPerson[]>([]);
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
  const addByPhoneBatch = useMutation(api.connections.addByPhoneBatch);

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
        return true;
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
      const guild = guilds?.find((g) => g._id === guildId);
      if (guild) {
        const memberIds = guild.members.map((m) => m.userId);
        setSelectedUserIds((prev) => {
          const isSelected = selectedGuildIds.includes(guildId);
          if (isSelected) {
            return prev.filter((id) => !memberIds.includes(id));
          } else {
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
    let resultSessionId: string;
    let shortCode: string;
    let gymName: string;
    let raidTime: Date;

    try {
      if (isQuickRaid) {
        await confirmRaid({
          sessionId: params.quickRaidSessionId as Id<"sessions">,
        });
        resultSessionId = params.quickRaidSessionId!;
        shortCode = params.quickRaidShortCode!;
        gymName = params.quickRaidGymName ?? "";
        raidTime = scheduledAt;
      } else {
        const result = await createRaid({
          gymId: selectedGymId!,
          scheduledAt: scheduledAt.getTime(),
          note: note || undefined,
          inviteUserIds: selectedUserIds,
          inviteGuildIds: selectedGuildIds,
        });
        await confirmRaid({ sessionId: result.sessionId });
        if (phoneInvites.length > 0) {
          await addByPhoneBatch({
            entries: phoneInvites.map((p) => ({ phone: p.phone, nickname: p.name })),
            sessionId: result.sessionId,
          });
        }
        resultSessionId = result.sessionId;
        shortCode = result.shortCode;
        gymName = selectedGymName;
        raidTime = scheduledAt;
      }
    } catch (error) {
      setIsSubmitting(false);
      throw error;
    }

    const shareUrl = `${process.env.EXPO_PUBLIC_CONVEX_SITE_URL}/j/${shortCode}`;
    const shareMessage = `Climb at ${gymName} — ${formatDate(raidTime)} at ${formatTime(raidTime)}`;
    try {
      await Share.share(
        Platform.OS === "ios"
          ? { message: shareMessage, url: shareUrl }
          : { message: `${shareMessage}\n${shareUrl}` }
      );
    } catch {
      // User cancelled or share failed — continue to navigation
    }

    router.replace({
      pathname: "/session/[id]",
      params: { id: resultSessionId },
    });
  }, [
    isQuickRaid,
    params,
    selectedGymId,
    selectedGymName,
    scheduledAt,
    note,
    selectedUserIds,
    selectedGuildIds,
    phoneInvites,
    createRaid,
    confirmRaid,
    addByPhoneBatch,
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

  const quickRaidMembers = params.quickRaidInvitedMembers
    ? JSON.parse(params.quickRaidInvitedMembers)
    : [];

  const isSearching = gymSearch.trim().length > 0;
  const hasFavorites = favoriteGyms && favoriteGyms.length > 0;

  const gymsToShow = useMemo(() => {
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

  // ─── Step Renderers ──────────────────────────────────────────────────────────

  const renderGymStep = () => (
    <ScrollView style={styles.stepContent} contentContainerStyle={styles.stepContentContainer}>
      <SectionHeader title={t("raid.step.gym")} />

      <View style={styles.gymSearchRow}>
        <View style={styles.gymSearchInputWrapper}>
          <PixelIcon name="magnifier" size={18} style={styles.searchIcon} />
          <TextInput
            style={styles.gymSearchInput}
            placeholder="Search gyms..."
            placeholderTextColor={COLORS.muted}
            value={gymSearch}
            onChangeText={setGymSearch}
            autoCorrect={false}
          />
        </View>
        <Pressable
          style={[styles.locateButton, userLocation && styles.locateButtonActive]}
          onPress={handleLocate}
          disabled={locating}
        >
          {locating ? (
            <ActivityIndicator color={COLORS.primary} size="small" />
          ) : (
            <PixelIcon
              name="compass"
              size={20}
              style={!userLocation ? { opacity: 0.5 } : undefined}
            />
          )}
        </Pressable>
      </View>

      {!isSearching && userLocation && (
        <Text style={styles.sectionLabel}>◈ NEARBY</Text>
      )}
      {!isSearching && !userLocation && hasFavorites && (
        <Text style={styles.sectionLabel}>◈ FAVORITES</Text>
      )}

      {isSearching && searchResults === undefined ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
      ) : gymsToShow.length === 0 ? (
        <Text style={styles.emptyText}>
          {isSearching
            ? "No gyms found"
            : "Tap the compass or search for a gym"}
        </Text>
      ) : (
        gymsToShow.map((gym) => {
          const dist = userLocation ? haversineKm(userLocation, gym) : null;
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
                <View style={styles.gymSlot}>
                  <Image source={itemSlot} style={styles.gymSlotBg} resizeMode="contain" />
                  <PixelIcon name="boulder" size={24} style={styles.gymSlotIcon} />
                </View>
                <View style={styles.gymInfo}>
                  <Text style={[styles.gymName, isSelected && styles.gymNameSelected]}>
                    {gym.name}
                  </Text>
                  <Text style={styles.gymAddress}>
                    {gym.address ? `${gym.address}, ` : ""}{gym.city}, {gym.state}
                  </Text>
                </View>
                {dist !== null && (
                  <Text style={styles.gymDistance}>{formatDistance(dist)}</Text>
                )}
                {isSelected && (
                  <PixelIcon name="checkmark" size={20} />
                )}
              </View>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );

  const renderTimeStep = () => (
    <ScrollView style={styles.stepContent} contentContainerStyle={styles.stepContentContainer}>
      <SectionHeader title={t("raid.step.time")} />

      <View style={styles.dayRow}>
        <Pressable
          style={[styles.dayChip, isToday(scheduledAt) && styles.dayChipSelected]}
          onPress={setToday}
        >
          <Text style={[styles.dayChipText, isToday(scheduledAt) && styles.dayChipTextSelected]}>
            {t("raid.time.today")}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.dayChip, isTomorrow(scheduledAt) && styles.dayChipSelected]}
          onPress={setTomorrow}
        >
          <Text style={[styles.dayChipText, isTomorrow(scheduledAt) && styles.dayChipTextSelected]}>
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

      <ParchmentPanel style={styles.dateDisplay}>
        <Text style={styles.selectedDateText}>{formatDate(scheduledAt)}</Text>
      </ParchmentPanel>

      <Text style={styles.timeLabel}>
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
      <SectionHeader title={t("raid.step.invite")} />

      {guilds && guilds.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>◈ {t("raid.invite.guilds")}</Text>
          <View style={styles.guildRow}>
            {guilds.map((guild) => {
              const isSelected = selectedGuildIds.includes(guild._id);
              return (
                <Pressable
                  key={guild._id}
                  style={[styles.guildChip, isSelected && styles.guildChipSelected]}
                  onPress={() => toggleGuild(guild._id)}
                >
                  <PixelIcon name="shield" size={16} style={{ marginRight: 6 }} />
                  <Text style={[styles.guildChipText, isSelected && styles.guildChipTextSelected]}>
                    {guild.name} ({guild.members.length})
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      {connections && connections.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>◈ {t("raid.invite.connections")}</Text>
          {connections.map((conn) => {
            const isSelected = selectedUserIds.includes(conn.connectedUserId);
            return (
              <Pressable
                key={conn._id}
                style={[styles.connectionRow, isSelected && styles.connectionRowSelected]}
                onPress={() => toggleUser(conn.connectedUserId)}
              >
                <PixelIcon name="helmet" size={28} style={styles.connectionAvatar} />
                <View style={styles.connectionInfo}>
                  <Text style={[styles.connectionName, isSelected && styles.connectionNameSelected]}>
                    {conn.nickname ?? conn.generatedName}
                  </Text>
                  {conn.nickname && (
                    <Text style={styles.connectionSubname}>{conn.generatedName}</Text>
                  )}
                </View>
                <Text style={styles.connectionLevel}>Lv.{conn.level}</Text>
                <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                  {isSelected && <PixelIcon name="checkmark" size={14} />}
                </View>
              </Pressable>
            );
          })}
        </>
      )}

      <Pressable style={styles.addPhoneButton} onPress={() => setShowAddPeople(true)}>
        <PixelIcon name="plus" size={16} style={{ marginRight: 8 }} />
        <Text style={styles.addPhoneText}>{t("raid.invite.add_phone")}</Text>
      </Pressable>

      {phoneInvites.length > 0 && (
        <View style={styles.phoneInviteList}>
          {phoneInvites.map((p) => (
            <View key={p.phone} style={styles.phoneInviteRow}>
              {p.name && <Text style={styles.phoneInviteName}>{p.name}</Text>}
              <Text style={styles.phoneInvitePhone}>{p.phone}</Text>
            </View>
          ))}
        </View>
      )}

      {selectedGuildIds.length === 0 && selectedUserIds.length === 0 && (
        <Text style={styles.emptyInviteText}>No one selected — solo raid!</Text>
      )}
    </ScrollView>
  );

  const renderConfirmStep = () => {
    const displayGymName = isQuickRaid ? params.quickRaidGymName ?? "" : selectedGymName;
    const displayDate = scheduledAt;
    const displayGuildName = isQuickRaid ? params.quickRaidGuildName : undefined;

    let invitedNames: string[] = [];
    if (isQuickRaid && quickRaidMembers.length > 0) {
      invitedNames = quickRaidMembers.map(
        (m: { nickname?: string; generatedName: string }) =>
          m.nickname ?? m.generatedName
      );
    } else {
      const allSelectedUserIds = new Set(selectedUserIds.map((id) => id.toString()));
      for (const guildId of selectedGuildIds) {
        const guild = guilds?.find((g) => g._id === guildId);
        if (guild) {
          for (const m of guild.members) allSelectedUserIds.add(m.userId.toString());
        }
      }
      for (const uid of allSelectedUserIds) {
        const conn = connections?.find((c) => c.connectedUserId.toString() === uid);
        if (conn) {
          invitedNames.push(conn.nickname ?? conn.generatedName ?? "Unknown");
        } else {
          for (const guild of guilds ?? []) {
            const member = guild.members.find((m) => m.userId.toString() === uid);
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
        <SectionHeader title={t("raid.step.confirm")} />

        <ParchmentPanel style={styles.confirmCard}>
          <View style={styles.confirmIconRow}>
            <PixelIcon name="swords" size={40} />
          </View>

          <Text style={styles.confirmLabel}>{t("raid.confirm.gym")}</Text>
          <Text style={styles.confirmValue}>{displayGymName}</Text>

          <Text style={styles.confirmLabel}>{t("raid.confirm.time")}</Text>
          <Text style={styles.confirmValue}>
            {formatDate(displayDate)} @ {formatTime(displayDate)}
          </Text>

          {displayGuildName && (
            <>
              <Text style={styles.confirmLabel}>GUILD</Text>
              <Text style={styles.confirmValue}>{displayGuildName}</Text>
            </>
          )}

          <Text style={styles.confirmLabel}>{t("raid.confirm.party")}</Text>
          {invitedNames.length > 0 ? (
            <>
              <Text style={styles.confirmValue}>
                {t("raid.confirm.members_count", { count: invitedNames.length + 1 })}
              </Text>
              {invitedNames.map((name, idx) => (
                <Text key={idx} style={styles.memberName}>
                  ▸ {name}
                </Text>
              ))}
            </>
          ) : (
            <Text style={styles.confirmValue}>Just you (solo raid)</Text>
          )}
        </ParchmentPanel>

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

        <View style={[styles.confirmButtonWrapper, isSubmitting && { opacity: 0.5 }]}>
          {isSubmitting ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={styles.loadingText}>Sending invites...</Text>
            </View>
          ) : (
            <StoneButton label={t("raid.confirm.send")} onPress={handleConfirm} />
          )}
        </View>
      </ScrollView>
    );
  };

  const renderStep = () => {
    switch (step) {
      case "gym":    return renderGymStep();
      case "time":   return renderTimeStep();
      case "invite": return renderInviteStep();
      case "confirm": return renderConfirmStep();
    }
  };

  return (
    <View style={styles.container}>
      <StepIndicator currentStep={step} />

      {renderStep()}

      {step !== "confirm" && (
        <View style={[styles.navRow, { paddingBottom: Math.max(12, bottomInset) }]}>
          <StoneButton label={t("raid.step.back")} onPress={goBack} style={{ flex: 1 }} />
          <View style={[{ flex: 1 }, !canGoNext() && { opacity: 0.4 }]}>
            <StoneButton label={t("raid.step.next")} onPress={canGoNext() ? goNext : () => {}} style={{ alignSelf: "stretch" }} />
          </View>
        </View>
      )}

      {step === "confirm" && (
        <View style={[styles.navRow, { paddingBottom: Math.max(12, bottomInset) }]}>
          <StoneButton label={t("raid.step.back")} onPress={goBack} style={{ flex: 1 }} />
        </View>
      )}

      <AddPeopleModal
        visible={showAddPeople}
        onClose={() => setShowAddPeople(false)}
        mode="batch"
        onAdd={(entries) => {
          setPhoneInvites((prev) => {
            const existing = new Set(prev.map((p) => p.phone));
            return [...prev, ...entries.filter((e) => !existing.has(e.phone))];
          });
          setShowAddPeople(false);
        }}
      />
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
  gymSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  gymSearchInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 2,
    paddingHorizontal: 10,
    gap: 8,
  },
  searchIcon: {
    opacity: 0.7,
  },
  gymSearchInput: {
    flex: 1,
    paddingVertical: 12,
    color: COLORS.text,
    fontFamily: "VT323",
    fontSize: 18,
  },
  locateButton: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  locateButtonActive: {
    borderColor: COLORS.primary,
  },
  sectionLabel: {
    fontFamily: "VT323",
    fontSize: 16,
    color: COLORS.muted,
    letterSpacing: 2,
    marginBottom: 8,
    marginTop: 4,
  },
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
  gymSlot: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  gymSlotBg: {
    position: "absolute",
    width: 40,
    height: 40,
  },
  gymSlotIcon: {
    zIndex: 1,
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
  gymDistance: {
    fontFamily: "VT323",
    fontSize: 16,
    color: COLORS.primary,
  },
  emptyText: {
    fontFamily: "VT323",
    fontSize: 18,
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 40,
  },

  // ─── Time step ──────────────────────────────────────────────────────────────
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
  timeLabel: {
    fontFamily: "VT323",
    fontSize: 16,
    color: COLORS.muted,
    letterSpacing: 2,
    marginBottom: 8,
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

  // ─── Invite step ─────────────────────────────────────────────────────────────
  guildRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  guildChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 2,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  guildChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.cardSelected,
  },
  guildChipText: {
    fontFamily: "VT323",
    fontSize: 18,
    color: COLORS.text,
  },
  guildChipTextSelected: {
    color: COLORS.primary,
  },
  connectionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 2,
    padding: 10,
    marginBottom: 6,
    gap: 10,
  },
  connectionRowSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.cardSelected,
  },
  connectionAvatar: {
    opacity: 0.8,
  },
  connectionInfo: {
    flex: 1,
  },
  connectionName: {
    fontFamily: "VT323",
    fontSize: 20,
    color: COLORS.text,
  },
  connectionNameSelected: {
    color: COLORS.primary,
  },
  connectionSubname: {
    fontFamily: "VT323",
    fontSize: 15,
    color: COLORS.muted,
  },
  connectionLevel: {
    fontFamily: "VT323",
    fontSize: 16,
    color: COLORS.muted,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: COLORS.xp,
    borderColor: COLORS.xp,
  },
  addPhoneButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 2,
    borderStyle: "dashed",
    padding: 14,
    marginTop: 10,
    justifyContent: "center",
  },
  addPhoneText: {
    fontFamily: "VT323",
    fontSize: 18,
    color: COLORS.muted,
  },
  emptyInviteText: {
    fontFamily: "VT323",
    fontSize: 18,
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 20,
  },
  phoneInviteList: {
    marginTop: 8,
    gap: 6,
  },
  phoneInviteRow: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 2,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  phoneInviteName: {
    fontFamily: "VT323",
    fontSize: 16,
    color: COLORS.text,
  },
  phoneInvitePhone: {
    fontFamily: "VT323",
    fontSize: 14,
    color: COLORS.muted,
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
  memberName: {
    fontFamily: "VT323",
    fontSize: 18,
    color: COLORS.bg,
    opacity: 0.8,
    paddingLeft: 8,
    marginTop: 2,
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
