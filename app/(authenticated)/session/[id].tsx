import { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Modal,
  Alert,
  Share,
  Platform,
  TextInput,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { t } from "@/lib/copy/en";
import { allGrades, type GradeSystem } from "@/lib/grades/parser";
import { COLORS } from "@/lib/theme";
import { Avatar } from "@/components/Avatar";
import { PixelIcon } from "@/components/PixelIcon";
import { SectionHeader } from "@/components/SectionHeader";
import { StoneButton } from "@/components/StoneButton";
import { LevelUpModal } from "@/components/LevelUpModal";
import { ParchmentPanel } from "@/components/ParchmentPanel";

const itemSlotStone = require("@/assets/images/ui/ItemSlotStone.webp");
const metalFrame = require("@/assets/images/ui/MetalFrame.webp");

function formatSessionTime(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  })} at ${date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

function formatClimbTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

const DIFFICULTY_RATINGS = [
  { key: "soft" as const, label: t("log.soft") },
  { key: "on_grade" as const, label: t("log.on_grade") },
  { key: "hard" as const, label: t("log.hard") },
  { key: "very_hard" as const, label: t("log.very_hard") },
];

type DifficultyRating = "soft" | "on_grade" | "hard" | "very_hard";

// ─── Log Climb Modal ──────────────────────────────────────────
function LogClimbSheet({
  visible,
  onDismiss,
  sessionId,
  gymId,
  gradeSystem,
  onLevelUp,
}: {
  visible: boolean;
  onDismiss: () => void;
  sessionId: Id<"sessions">;
  gymId: Id<"gyms">;
  gradeSystem: GradeSystem;
  onLevelUp?: (levels: number[], totalXpAfter: number) => void;
}) {
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [climbType, setClimbType] = useState<"send" | "attempt">("send");
  const [difficulty, setDifficulty] = useState<DifficultyRating | null>(null);
  const [xpToast, setXpToast] = useState<string | null>(null);
  const [eventToasts, setEventToasts] = useState<string[]>([]);

  const logClimb = useMutation(api.progression.logClimb);
  const grades = allGrades(gradeSystem === "v_scale" ? "v_scale" : "yds");

  const handleLog = useCallback(async () => {
    if (!selectedGrade) return;
    try {
      const result = await logClimb({
        sessionId,
        gymId,
        grade: selectedGrade,
        gradeSystem,
        type: climbType,
        difficultyRating: difficulty ?? undefined,
      });

      setXpToast(t("log.success", { amount: result.xpAwarded }));

      const toasts: string[] = [];
      let levelUpLevels: number[] = [];
      for (const event of result.events) {
        if (event.type === "grade_breakthrough") {
          toasts.push(t("event.grade_breakthrough", { grade: event.metadata?.grade }));
        } else if (event.type === "level_up") {
          const oldLevel = event.metadata?.oldLevel ?? 1;
          const newLevel = event.metadata?.newLevel ?? oldLevel + 1;
          levelUpLevels = Array.from({ length: newLevel - oldLevel }, (_, i) => oldLevel + i + 1);
        } else if (event.type === "volume_pr") {
          toasts.push(t("event.volume_pr", { count: event.metadata?.count, grade: event.metadata?.grade }));
        } else if (event.type === "tape_earned") {
          toasts.push(t("event.tape_earned"));
        }
      }
      setEventToasts(toasts);

      const dismissDelay = levelUpLevels.length > 0 ? 800 : 1500;
      setTimeout(() => {
        setSelectedGrade(null);
        setClimbType("send");
        setDifficulty(null);
        setXpToast(null);
        setEventToasts([]);
        onDismiss();
        if (levelUpLevels.length > 0) {
          onLevelUp?.(levelUpLevels, result.totalXpAfter);
        }
      }, dismissDelay);
    } catch {
      // Let errors surface naturally
    }
  }, [selectedGrade, climbType, difficulty, sessionId, gymId, gradeSystem, logClimb, onDismiss]);

  const handleDismiss = useCallback(() => {
    setSelectedGrade(null);
    setClimbType("send");
    setDifficulty(null);
    setXpToast(null);
    setEventToasts([]);
    onDismiss();
  }, [onDismiss]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleDismiss}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.headerTitle}>{t("log.title")}</Text>
            <Pressable onPress={handleDismiss}>
              <Text style={modalStyles.closeButton}>✕</Text>
            </Pressable>
          </View>

          {xpToast && (
            <View style={modalStyles.toastContainer}>
              <Text style={modalStyles.xpToast}>{xpToast}</Text>
              {eventToasts.map((toast, i) => (
                <Text key={i} style={modalStyles.eventToast}>{toast}</Text>
              ))}
            </View>
          )}

          <Text style={modalStyles.sectionLabel}>{t("log.select_grade")}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={modalStyles.gradePicker}
            contentContainerStyle={modalStyles.gradePickerContent}
          >
            {grades.map((grade) => (
              <Pressable
                key={grade}
                style={[modalStyles.gradeChip, selectedGrade === grade && modalStyles.gradeChipActive]}
                onPress={() => setSelectedGrade(grade)}
              >
                <Text style={[modalStyles.gradeChipText, selectedGrade === grade && modalStyles.gradeChipTextActive]}>
                  {grade}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={modalStyles.toggleRow}>
            {(["send", "attempt"] as const).map((type) => (
              <Pressable
                key={type}
                style={[modalStyles.toggleChip, climbType === type && modalStyles.toggleChipActive]}
                onPress={() => setClimbType(type)}
              >
                <Text style={[modalStyles.toggleChipText, climbType === type && modalStyles.toggleChipTextActive]}>
                  {t(`log.${type}` as any)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={modalStyles.sectionLabel}>{t("log.difficulty")}</Text>
          <View style={modalStyles.toggleRow}>
            {DIFFICULTY_RATINGS.map((rating) => (
              <Pressable
                key={rating.key}
                style={[modalStyles.toggleChip, difficulty === rating.key && modalStyles.toggleChipActive]}
                onPress={() => setDifficulty(difficulty === rating.key ? null : rating.key)}
              >
                <Text style={[modalStyles.toggleChipText, difficulty === rating.key && modalStyles.toggleChipTextActive]}>
                  {rating.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[modalStyles.logButton, !selectedGrade && modalStyles.logButtonDisabled]}
            onPress={handleLog}
            disabled={!selectedGrade}
          >
            <Text style={modalStyles.logButtonText}>{t("log.button")}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─── Invite More Modal ────────────────────────────────────────
function InviteMoreModal({
  visible,
  sessionId,
  existingMemberIds,
  onClose,
}: {
  visible: boolean;
  sessionId: Id<"sessions">;
  existingMemberIds: string[];
  onClose: () => void;
}) {
  const connections = useQuery(api.connections.myConnections);
  const inviteToSession = useMutation(api.sessions.inviteToSession);
  const [selected, setSelected] = useState<Set<Id<"users">>>(new Set());
  const [saving, setSaving] = useState(false);

  const available = (connections ?? []).filter(
    (c) => !existingMemberIds.includes(c.connectedUserId)
  );

  function toggle(userId: Id<"users">) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  async function handleInvite() {
    if (selected.size === 0) return;
    setSaving(true);
    try {
      await inviteToSession({ sessionId, userIds: Array.from(selected) });
      setSelected(new Set());
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.headerTitle}>{t("action.invite_more")}</Text>
            <Pressable onPress={onClose}>
              <Text style={modalStyles.closeButton}>✕</Text>
            </Pressable>
          </View>

          {available.length === 0 ? (
            <Text style={modalStyles.sectionLabel}>No connections to invite.</Text>
          ) : (
            <ScrollView style={{ maxHeight: 300 }}>
              {available.map((conn) => {
                const isSelected = selected.has(conn.connectedUserId);
                const displayName = conn.nickname ?? conn.generatedName ?? "Adventurer";
                return (
                  <Pressable
                    key={conn._id}
                    style={[modalStyles.memberSelectRow, isSelected && modalStyles.memberSelectRowActive]}
                    onPress={() => toggle(conn.connectedUserId)}
                  >
                    <Avatar seed={conn.connectedUserId} size={36} />
                    <Text style={modalStyles.memberSelectName}>{displayName}</Text>
                    {isSelected && <PixelIcon name="checkmark" size={20} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          <View style={{ marginTop: 16 }}>
            {saving ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <StoneButton
                label={`Invite (${selected.size})`}
                onPress={handleInvite}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Party Member Row ─────────────────────────────────────────
function MemberRow({
  member,
  isLeader,
}: {
  member: {
    userId: Id<"users">;
    generatedName?: string;
    nickname?: string;
    level?: number;
    status: string;
    checkedIn: boolean;
    isCurrentUser: boolean;
    currentStatus?: { effect: string; type: string };
  };
  isLeader: boolean;
}) {
  const displayName = member.isCurrentUser
    ? "You"
    : member.nickname ?? member.generatedName ?? "Adventurer";

  const isDebuff = member.currentStatus?.type === "debuff";

  const statusColor =
    member.status === "accepted"
      ? COLORS.success
      : member.status === "declined"
      ? COLORS.danger
      : COLORS.primary;

  return (
    <View style={styles.memberRow}>
      <View style={styles.memberAvatarWrap}>
        <Image source={itemSlotStone} style={styles.memberSlotBg} resizeMode="contain" />
        <Avatar seed={member.userId} size={40} />
        {member.checkedIn ? (
          <View style={styles.memberStatusIcon}>
            <PixelIcon name="checkmark" size={14} />
          </View>
        ) : member.status === "accepted" ? (
          <View style={styles.memberStatusIcon}>
            <PixelIcon name="hourglass" size={14} />
          </View>
        ) : null}
      </View>
      <View style={styles.memberInfo}>
        <View style={styles.memberNameRow}>
          <Text style={styles.memberName}>{displayName}</Text>
          {isLeader && <PixelIcon name="crown" size={16} />}
          {member.currentStatus && (
            <View style={[styles.statusBadge, isDebuff && styles.statusBadgeDebuff]}>
              <Text style={[styles.statusBadgeText, isDebuff && styles.statusBadgeTextDebuff]}>
                {member.currentStatus.effect}
              </Text>
            </View>
          )}
        </View>
        {member.nickname && !member.isCurrentUser && member.generatedName && (
          <Text style={styles.memberSubname}>{member.generatedName}</Text>
        )}
        <Text style={styles.memberLevel}>Lv. {member.level ?? 1}</Text>
      </View>
      <View style={[styles.memberStatusBadge, { backgroundColor: statusColor + "20" }]}>
        <Text style={[styles.memberStatusText, { color: statusColor }]}>
          {member.status}
        </Text>
      </View>
    </View>
  );
}

// ─── Send Row ─────────────────────────────────────────────────
function SendRow({
  send,
}: {
  send: {
    grade: string;
    type: string;
    xpAwarded: number;
    difficultyRating?: string | null;
    climbedAt: number;
    userName: string;
  };
}) {
  return (
    <View style={styles.sendRow}>
      <View style={styles.sendGradeChip}>
        <Text style={styles.sendGradeText}>{send.grade}</Text>
      </View>
      <View style={styles.sendInfo}>
        <Text style={styles.sendUserName}>{send.userName}</Text>
        <View style={styles.sendMeta}>
          <View style={[styles.sendTypeBadge, send.type === "attempt" && styles.sendTypeBadgeAttempt]}>
            <Text style={styles.sendTypeText}>{send.type}</Text>
          </View>
          {send.difficultyRating && (
            <Text style={styles.sendDifficulty}>{send.difficultyRating.replace("_", " ")}</Text>
          )}
        </View>
      </View>
      <View style={styles.sendRight}>
        <Text style={styles.sendXp}>+{send.xpAwarded} XP</Text>
        <Text style={styles.sendTime}>{formatClimbTime(send.climbedAt)}</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────
export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const [showLogSheet, setShowLogSheet] = useState(false);
  const [showInviteMore, setShowInviteMore] = useState(false);
  const [editingCheckIn, setEditingCheckIn] = useState(false);
  const [checkInDraft, setCheckInDraft] = useState("");
  const [levelUpData, setLevelUpData] = useState<{ levels: number[]; totalXpAfter: number } | null>(null);

  const session = useQuery(
    api.sessions.detail,
    id ? { sessionId: id as Id<"sessions"> } : "skip"
  );
  const sends = useQuery(
    api.progression.sessionSends,
    id ? { sessionId: id as Id<"sessions"> } : "skip"
  );
  const me = useQuery(api.users.me);

  const cancelAttendance = useMutation(api.sessions.cancelAttendance);
  const desertAsLeader = useMutation(api.sessions.desertAsLeader);
  const volunteerAsLeader = useMutation(api.sessions.volunteerAsLeader);
  const confirmAttendance = useMutation(api.sessions.confirmAttendance);
  const updateCheckInMessage = useMutation(api.sessions.updateCheckInMessage);

  const handleShare = useCallback(async () => {
    if (!session) return;
    const shareUrl = `${process.env.EXPO_PUBLIC_CONVEX_SITE_URL}/j/${session.shortCode}`;
    const message = `Climb at ${session.gymName} — ${formatSessionTime(session.scheduledAt)}`;
    try {
      await Share.share(
        Platform.OS === "ios"
          ? { message, url: shareUrl }
          : { message: `${message}\n${shareUrl}` }
      );
    } catch {
      // User cancelled
    }
  }, [session]);

  if (session === undefined) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (session === null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Session not found</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const myId = me?._id;
  const isLeader = session.leaderId === myId;
  const myMembership = session.members.find((m) => m.isCurrentUser);
  const myStatus = myMembership?.status;
  const isAccepted = myStatus === "accepted";
  const isLeaderDeserted = !!session.dissolveAt;

  const climbingStyles = me?.climbingStyles ?? [];
  const isBoulder =
    climbingStyles.includes("Boulder") &&
    !climbingStyles.includes("Lead") &&
    !climbingStyles.includes("Top Rope");
  const gradeSystem: GradeSystem = isBoulder ? "v_scale" : "yds";

  const isActive = session.status === "active" || session.status === "open";

  const sessionTypeLabel = session.type === "raid" ? t("session.raid") : t("session.quest");

  async function handleCancelAttendance() {
    Alert.alert("Cancel Attendance", "Are you sure you want to leave this session?", [
      { text: "Stay", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          try {
            await cancelAttendance({ sessionId: id as Id<"sessions"> });
          } catch (e: any) {
            Alert.alert("Error", e.message);
          }
        },
      },
    ]);
  }

  async function handleDesert() {
    Alert.alert(
      "Desert as Leader",
      "This starts a 30-minute window for someone to volunteer as the new leader. After that, the raid dissolves.",
      [
        { text: "Stay", style: "cancel" },
        {
          text: "Desert",
          style: "destructive",
          onPress: async () => {
            try {
              await desertAsLeader({ sessionId: id as Id<"sessions"> });
            } catch (e: any) {
              Alert.alert("Error", e.message);
            }
          },
        },
      ]
    );
  }

  async function handleVolunteer() {
    try {
      await volunteerAsLeader({ sessionId: id as Id<"sessions"> });
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  }

  async function handleConfirmAttendance() {
    try {
      await confirmAttendance({ sessionId: id as Id<"sessions"> });
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  }

  async function handleSaveCheckIn() {
    try {
      await updateCheckInMessage({ sessionId: id as Id<"sessions">, message: checkInDraft });
      setEditingCheckIn(false);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <PixelIcon name="back" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>{sessionTypeLabel}</Text>
        <Pressable style={styles.shareBtn} onPress={handleShare}>
          <PixelIcon name="handshake" size={20} />
        </Pressable>
        <View style={styles.sessionStatusBadge}>
          <Text style={styles.sessionStatusText}>
            {t(`session.status.${session.status}` as any)}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Session Info */}
        <ParchmentPanel style={styles.infoCard}>
          <Text style={styles.infoLabel}>Dungeon</Text>
          <Text style={styles.infoValue}>{session.gymName}</Text>
          {session.gymAddress && (
            <Text style={styles.infoSub}>{session.gymAddress}, {session.gymCity}</Text>
          )}
          <Text style={styles.infoLabel}>Time</Text>
          <Text style={styles.infoValue}>{formatSessionTime(session.scheduledAt)}</Text>
          {session.note && (
            <>
              <Text style={styles.infoLabel}>Note</Text>
              <Text style={styles.infoValue}>{session.note}</Text>
            </>
          )}
        </ParchmentPanel>

        {/* Check-in Message */}
        {(session.checkInMessage || isLeader) && (
          <View style={styles.checkInBlock}>
            {editingCheckIn ? (
              <View style={styles.checkInEdit}>
                <TextInput
                  style={styles.checkInInput}
                  value={checkInDraft}
                  onChangeText={setCheckInDraft}
                  placeholder="Check-in location or message..."
                  placeholderTextColor={COLORS.muted}
                  multiline
                  autoFocus
                />
                <View style={styles.checkInEditActions}>
                  <Pressable onPress={() => setEditingCheckIn(false)} style={styles.checkInCancelBtn}>
                    <Text style={styles.checkInCancelText}>Cancel</Text>
                  </Pressable>
                  <StoneButton label="Save" onPress={handleSaveCheckIn} />
                </View>
              </View>
            ) : (
              <Pressable
                onPress={isLeader ? () => { setCheckInDraft(session.checkInMessage ?? ""); setEditingCheckIn(true); } : undefined}
                style={styles.checkInDisplay}
              >
                <PixelIcon name="signpost" size={18} />
                <Text style={styles.checkInText}>
                  {session.checkInMessage ?? "Set check-in message..."}
                </Text>
                {isLeader && <PixelIcon name="gear" size={14} />}
              </Pressable>
            )}
          </View>
        )}

        {/* Dissolve warning */}
        {isLeaderDeserted && (
          <View style={styles.dissolveWarning}>
            <PixelIcon name="skull" size={20} />
            <Text style={styles.dissolveText}>Leader deserted! Step up or the raid dissolves.</Text>
            {isAccepted && !isLeader && (
              <Pressable onPress={handleVolunteer} style={styles.volunteerBtn}>
                <Text style={styles.volunteerBtnText}>{t("action.take_over")}</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Party */}
        <SectionHeader title="Party" />
        <View style={styles.memberList}>
          {session.members.map((member, i) => (
            <View key={member.userId} style={i > 0 ? styles.memberRowBorder : undefined}>
              <MemberRow
                member={member}
                isLeader={member.userId === session.leaderId}
              />
            </View>
          ))}
        </View>

        {/* Invite More button */}
        {isAccepted && isActive && (
          <View style={styles.inviteMoreWrap}>
            <StoneButton
              label={t("action.invite_more")}
              onPress={() => setShowInviteMore(true)}
            />
          </View>
        )}

        {/* Action buttons */}
        {isAccepted && isActive && (
          <View style={styles.actionsRow}>
            {!myMembership?.checkedIn && (
              <Pressable onPress={handleConfirmAttendance} style={styles.confirmBtn}>
                <PixelIcon name="checkmark" size={16} />
                <Text style={styles.confirmBtnText}>I'm here</Text>
              </Pressable>
            )}
            {isLeader ? (
              <Pressable onPress={handleDesert} style={styles.desertBtn}>
                <Text style={styles.desertBtnText}>Desert</Text>
              </Pressable>
            ) : (
              <Pressable onPress={handleCancelAttendance} style={styles.desertBtn}>
                <Text style={styles.desertBtnText}>{t("action.cancel_attendance")}</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Summary button for completed sessions */}
        {session.status === "completed" && (
          <View style={styles.summaryBannerWrap}>
            <Pressable
              style={styles.summaryBanner}
              onPress={() =>
                router.push({
                  pathname: "/session/summary",
                  params: { id: session._id },
                })
              }
            >
              <PixelIcon name="scroll" size={20} />
              <Text style={styles.summaryBannerText}>VIEW SESSION SUMMARY</Text>
              <PixelIcon name="scroll" size={20} />
            </Pressable>
          </View>
        )}

        {/* Live Sends */}
        <SectionHeader title={t("session.sends")} />
        {sends && sends.length > 0 ? (
          <View style={styles.sendList}>
            {sends.map((send, i) => (
              <View key={send._id} style={i > 0 ? styles.sendRowBorder : undefined}>
                <SendRow send={send} />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptySends}>
            <Text style={styles.emptySendsText}>{t("session.no_sends")}</Text>
          </View>
        )}

        <View style={{ height: isAccepted && isActive ? 96 : 24 }} />
      </ScrollView>

      {/* Log Climb bottom bar */}
      {isAccepted && isActive && (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(12, bottomInset) }]}>
          <StoneButton label="+ LOG CLIMB" onPress={() => setShowLogSheet(true)} style={{ alignSelf: "stretch" }} />
        </View>
      )}

      <LogClimbSheet
        visible={showLogSheet}
        onDismiss={() => setShowLogSheet(false)}
        sessionId={id as Id<"sessions">}
        gymId={session.gymId}
        gradeSystem={gradeSystem}
        onLevelUp={(levels, totalXpAfter) => setLevelUpData({ levels, totalXpAfter })}
      />

      <LevelUpModal
        visible={levelUpData !== null}
        levels={levelUpData?.levels ?? []}
        totalXpAfter={levelUpData?.totalXpAfter ?? 0}
        onDismiss={() => setLevelUpData(null)}
      />

      <InviteMoreModal
        visible={showInviteMore}
        sessionId={id as Id<"sessions">}
        existingMemberIds={session.members.map((m) => m.userId)}
        onClose={() => setShowInviteMore(false)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    backgroundColor: "#c4a882",
    borderTopWidth: 3,
    borderTopColor: "#5a4230",
    borderLeftWidth: 3,
    borderLeftColor: "#5a4230",
    borderRightWidth: 3,
    borderRightColor: "#5a4230",
    borderRadius: 4,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 20,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontFamily: "VT323",
    fontSize: 24,
    color: "#3b2a1a",
    letterSpacing: 2,
  },
  closeButton: {
    fontFamily: "VT323",
    fontSize: 22,
    color: "#7a5c3a",
    padding: 4,
  },
  toastContainer: {
    backgroundColor: "#a8906e",
    borderWidth: 2,
    borderColor: "#5a4230",
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  xpToast: {
    fontFamily: "VT323",
    fontSize: 26,
    color: "#3b8a3b",
    letterSpacing: 1,
  },
  eventToast: {
    fontFamily: "VT323",
    fontSize: 18,
    color: "#8a5c1a",
    marginTop: 4,
  },
  sectionLabel: {
    fontFamily: "VT323",
    fontSize: 15,
    color: "#7a5c3a",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  gradePicker: {
    maxHeight: 48,
    marginBottom: 16,
  },
  gradePickerContent: {
    alignItems: "center",
    gap: 6,
    paddingRight: 16,
  },
  gradeChip: {
    backgroundColor: "#a8906e",
    borderWidth: 2,
    borderColor: "#5a4230",
    borderRadius: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  gradeChipActive: {
    backgroundColor: "#5a4230",
    borderColor: "#3b2a1a",
  },
  gradeChipText: {
    fontFamily: "VT323",
    fontSize: 18,
    color: "#5a4230",
  },
  gradeChipTextActive: {
    color: "#e8d8c0",
  },
  toggleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  toggleChip: {
    backgroundColor: "#a8906e",
    borderWidth: 2,
    borderColor: "#5a4230",
    borderRadius: 2,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  toggleChipActive: {
    backgroundColor: "#5a4230",
    borderColor: "#3b2a1a",
  },
  toggleChipText: {
    fontFamily: "VT323",
    fontSize: 18,
    color: "#5a4230",
  },
  toggleChipTextActive: {
    color: "#e8d8c0",
  },
  logButton: {
    backgroundColor: "#5a4230",
    borderWidth: 2,
    borderColor: "#3b2a1a",
    paddingVertical: 14,
    borderRadius: 2,
    alignItems: "center",
    marginTop: 8,
  },
  logButtonDisabled: {
    opacity: 0.4,
  },
  logButtonText: {
    fontFamily: "VT323",
    fontSize: 24,
    color: "#e8d8c0",
    letterSpacing: 2,
  },
  memberSelectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  memberSelectRowActive: {
    backgroundColor: COLORS.cardSelected,
  },
  memberSelectName: {
    flex: 1,
    fontFamily: "VT323",
    fontSize: 18,
    color: COLORS.text,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  centered: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontFamily: "VT323",
    fontSize: 22,
    color: COLORS.text,
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backBtnText: {
    fontFamily: "VT323",
    fontSize: 18,
    color: COLORS.bg,
  },

  // ─── Header ───────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 56 : 20,
    paddingBottom: 12,
    backgroundColor: COLORS.bg,
    gap: 10,
  },
  headerTitle: {
    flex: 1,
    fontFamily: "VT323",
    fontSize: 24,
    color: COLORS.text,
  },
  shareBtn: {
    padding: 4,
  },
  sessionStatusBadge: {
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sessionStatusText: {
    fontFamily: "VT323",
    fontSize: 13,
    color: COLORS.muted,
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  // ─── Info Card (ParchmentPanel receives `style` on outer) ────
  infoCard: {
    marginBottom: 12,
  },
  infoLabel: {
    fontFamily: "VT323",
    fontSize: 14,
    color: "#7a5c3a",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 2,
  },
  infoValue: {
    fontFamily: "VT323",
    fontSize: 20,
    color: "#3b2a1a",
  },
  infoSub: {
    fontFamily: "VT323",
    fontSize: 14,
    color: "#7a5c3a",
    marginTop: 2,
  },

  // ─── Check-in Message ─────────────────────────
  checkInBlock: {
    marginBottom: 10,
  },
  checkInDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 12,
  },
  checkInText: {
    flex: 1,
    fontFamily: "VT323",
    fontSize: 16,
    color: COLORS.text,
  },
  checkInEdit: {
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 12,
  },
  checkInInput: {
    fontFamily: "VT323",
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 10,
    minHeight: 60,
  },
  checkInEditActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  checkInCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  checkInCancelText: {
    fontFamily: "VT323",
    fontSize: 16,
    color: COLORS.muted,
  },

  // ─── Dissolve Warning ─────────────────────────
  dissolveWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.danger + "20",
    borderWidth: 2,
    borderColor: COLORS.danger + "60",
    borderRadius: 4,
    padding: 12,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  dissolveText: {
    flex: 1,
    fontFamily: "VT323",
    fontSize: 15,
    color: COLORS.danger,
  },
  volunteerBtn: {
    backgroundColor: COLORS.danger,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  volunteerBtnText: {
    fontFamily: "VT323",
    fontSize: 16,
    color: "#fff",
  },

  // ─── Member List ──────────────────────────────
  memberList: {
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 10,
  },
  memberRowBorder: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
  },
  memberAvatarWrap: {
    position: "relative",
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  memberSlotBg: {
    position: "absolute",
    width: 54,
    height: 54,
  },
  memberStatusIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.bg,
    borderRadius: 8,
    padding: 1,
    zIndex: 2,
  },
  memberInfo: {
    flex: 1,
    minWidth: 0,
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  memberName: {
    fontFamily: "VT323",
    fontSize: 18,
    color: COLORS.text,
  },
  memberSubname: {
    fontFamily: "VT323",
    fontSize: 13,
    color: COLORS.muted,
  },
  memberLevel: {
    fontFamily: "VT323",
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: COLORS.xp + "25",
    borderWidth: 1,
    borderColor: COLORS.xp + "60",
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  statusBadgeDebuff: {
    backgroundColor: COLORS.danger + "20",
    borderColor: COLORS.danger + "60",
  },
  statusBadgeText: {
    fontFamily: "VT323",
    fontSize: 12,
    color: COLORS.xp,
  },
  statusBadgeTextDebuff: {
    color: COLORS.danger,
  },
  memberStatusBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  memberStatusText: {
    fontFamily: "VT323",
    fontSize: 13,
    textTransform: "uppercase",
  },

  // ─── Action Buttons ───────────────────────────
  inviteMoreWrap: {
    alignItems: "center",
    marginBottom: 10,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
    justifyContent: "flex-end",
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.success + "20",
    borderWidth: 2,
    borderColor: COLORS.success + "60",
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  confirmBtnText: {
    fontFamily: "VT323",
    fontSize: 16,
    color: COLORS.success,
  },
  desertBtn: {
    backgroundColor: COLORS.danger + "20",
    borderWidth: 2,
    borderColor: COLORS.danger + "60",
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  desertBtnText: {
    fontFamily: "VT323",
    fontSize: 16,
    color: COLORS.danger,
  },

  // ─── Sends ────────────────────────────────────
  sendList: {
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  sendRowBorder: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sendRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
  },
  sendGradeChip: {
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 48,
    alignItems: "center",
  },
  sendGradeText: {
    fontFamily: "VT323",
    fontSize: 16,
    color: COLORS.bg,
  },
  sendInfo: {
    flex: 1,
  },
  sendUserName: {
    fontFamily: "VT323",
    fontSize: 15,
    color: COLORS.text,
  },
  sendMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  sendTypeBadge: {
    backgroundColor: COLORS.success + "20",
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  sendTypeBadgeAttempt: {
    backgroundColor: COLORS.primary + "20",
  },
  sendTypeText: {
    fontFamily: "VT323",
    fontSize: 12,
    color: COLORS.text,
    textTransform: "uppercase",
  },
  sendDifficulty: {
    fontFamily: "VT323",
    fontSize: 12,
    color: COLORS.muted,
    textTransform: "capitalize",
  },
  sendRight: {
    alignItems: "flex-end",
  },
  sendXp: {
    fontFamily: "VT323",
    fontSize: 15,
    color: COLORS.success,
  },
  sendTime: {
    fontFamily: "VT323",
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 1,
  },
  emptySends: {
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 20,
    alignItems: "center",
  },
  emptySendsText: {
    fontFamily: "VT323",
    fontSize: 16,
    color: COLORS.muted,
  },

  // ─── Summary Banner ──────────────────────────
  summaryBannerWrap: {
    marginBottom: 8,
    alignItems: "center",
  },
  summaryBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.cardSelected,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 2,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  summaryBannerText: {
    fontFamily: "VT323",
    fontSize: 20,
    color: COLORS.primary,
    letterSpacing: 2,
  },

  // ─── Bottom Bar ───────────────────────────────
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.bg,
    borderTopWidth: 2,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    paddingHorizontal: 24,
  },
});
