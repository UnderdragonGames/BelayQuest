import { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Modal,
  Animated,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { t } from "@/lib/copy/en";
import { allGrades, type GradeSystem } from "@/lib/grades/parser";

const COLORS = {
  bg: "#1a1a2e",
  primary: "#f4a261",
  text: "#eaeaea",
  muted: "#666680",
  card: "#16213e",
  border: "#2a2a4a",
  success: "#2a9d8f",
  error: "#e76f51",
};

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

const STATUS_COLORS: Record<string, string> = {
  invited: "#f4a261",
  accepted: "#2a9d8f",
  declined: "#e76f51",
};

const DIFFICULTY_RATINGS = [
  { key: "soft" as const, label: t("log.soft") },
  { key: "on_grade" as const, label: t("log.on_grade") },
  { key: "hard" as const, label: t("log.hard") },
  { key: "very_hard" as const, label: t("log.very_hard") },
];

type DifficultyRating = "soft" | "on_grade" | "hard" | "very_hard";

// ─── Log Climb Sheet ──────────────────────────────────────────
function LogClimbSheet({
  visible,
  onDismiss,
  sessionId,
  gymId,
  gradeSystem,
}: {
  visible: boolean;
  onDismiss: () => void;
  sessionId: Id<"sessions">;
  gymId: Id<"gyms">;
  gradeSystem: GradeSystem;
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

      // Show XP toast
      setXpToast(t("log.success", { amount: result.xpAwarded }));

      // Show event toasts
      const toasts: string[] = [];
      for (const event of result.events) {
        if (event.type === "grade_breakthrough") {
          toasts.push(
            t("event.grade_breakthrough", { grade: event.metadata?.grade })
          );
        } else if (event.type === "level_up") {
          toasts.push(t("levelup", { level: event.metadata?.newLevel }));
        } else if (event.type === "volume_pr") {
          toasts.push(
            t("event.volume_pr", {
              count: event.metadata?.count,
              grade: event.metadata?.grade,
            })
          );
        } else if (event.type === "tape_earned") {
          toasts.push(t("event.tape_earned"));
        }
      }
      setEventToasts(toasts);

      // Reset and dismiss after delay
      setTimeout(() => {
        setSelectedGrade(null);
        setClimbType("send");
        setDifficulty(null);
        setXpToast(null);
        setEventToasts([]);
        onDismiss();
      }, 1500);
    } catch {
      // Let the error surface naturally
    }
  }, [
    selectedGrade,
    climbType,
    difficulty,
    sessionId,
    gymId,
    gradeSystem,
    logClimb,
    onDismiss,
  ]);

  const handleDismiss = useCallback(() => {
    setSelectedGrade(null);
    setClimbType("send");
    setDifficulty(null);
    setXpToast(null);
    setEventToasts([]);
    onDismiss();
  }, [onDismiss]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleDismiss}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          {/* Header */}
          <View style={modalStyles.header}>
            <Text style={modalStyles.headerTitle}>{t("log.title")}</Text>
            <Pressable onPress={handleDismiss}>
              <Text style={modalStyles.closeButton}>X</Text>
            </Pressable>
          </View>

          {/* Toast area */}
          {xpToast && (
            <View style={modalStyles.toastContainer}>
              <Text style={modalStyles.xpToast}>{xpToast}</Text>
              {eventToasts.map((toast, i) => (
                <Text key={i} style={modalStyles.eventToast}>
                  {toast}
                </Text>
              ))}
            </View>
          )}

          {/* Grade picker */}
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
                style={[
                  modalStyles.gradeChip,
                  selectedGrade === grade && modalStyles.gradeChipActive,
                ]}
                onPress={() => setSelectedGrade(grade)}
              >
                <Text
                  style={[
                    modalStyles.gradeChipText,
                    selectedGrade === grade && modalStyles.gradeChipTextActive,
                  ]}
                >
                  {grade}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Send / Attempt toggle */}
          <View style={modalStyles.toggleRow}>
            <Pressable
              style={[
                modalStyles.toggleChip,
                climbType === "send" && modalStyles.toggleChipActive,
              ]}
              onPress={() => setClimbType("send")}
            >
              <Text
                style={[
                  modalStyles.toggleChipText,
                  climbType === "send" && modalStyles.toggleChipTextActive,
                ]}
              >
                {t("log.send")}
              </Text>
            </Pressable>
            <Pressable
              style={[
                modalStyles.toggleChip,
                climbType === "attempt" && modalStyles.toggleChipActive,
              ]}
              onPress={() => setClimbType("attempt")}
            >
              <Text
                style={[
                  modalStyles.toggleChipText,
                  climbType === "attempt" && modalStyles.toggleChipTextActive,
                ]}
              >
                {t("log.attempt")}
              </Text>
            </Pressable>
          </View>

          {/* Difficulty rating */}
          <Text style={modalStyles.sectionLabel}>{t("log.difficulty")}</Text>
          <View style={modalStyles.toggleRow}>
            {DIFFICULTY_RATINGS.map((rating) => (
              <Pressable
                key={rating.key}
                style={[
                  modalStyles.toggleChip,
                  difficulty === rating.key && modalStyles.toggleChipActive,
                ]}
                onPress={() =>
                  setDifficulty(difficulty === rating.key ? null : rating.key)
                }
              >
                <Text
                  style={[
                    modalStyles.toggleChipText,
                    difficulty === rating.key &&
                      modalStyles.toggleChipTextActive,
                  ]}
                >
                  {rating.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Log button */}
          <Pressable
            style={[
              modalStyles.logButton,
              !selectedGrade && modalStyles.logButtonDisabled,
            ]}
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
          <View
            style={[
              styles.sendTypeBadge,
              send.type === "attempt" && styles.sendTypeBadgeAttempt,
            ]}
          >
            <Text style={styles.sendTypeText}>{send.type}</Text>
          </View>
          {send.difficultyRating && (
            <Text style={styles.sendDifficulty}>
              {send.difficultyRating.replace("_", " ")}
            </Text>
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
  const [showLogSheet, setShowLogSheet] = useState(false);

  const session = useQuery(
    api.sessions.detail,
    id ? { sessionId: id as Id<"sessions"> } : "skip"
  );
  const sends = useQuery(
    api.progression.sessionSends,
    id ? { sessionId: id as Id<"sessions"> } : "skip"
  );
  const me = useQuery(api.users.me);

  if (session === undefined) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (session === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Session not found</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  // Determine grade system from user's climbing styles
  const climbingStyles = me?.climbingStyles ?? [];
  const isBoulder =
    climbingStyles.includes("Boulder") && !climbingStyles.includes("Lead") && !climbingStyles.includes("Top Rope");
  const gradeSystem: GradeSystem = isBoulder ? "v_scale" : "yds";

  const isSessionActive =
    session.status === "active" || session.status === "open";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{t("session.raid")}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {t(`session.status.${session.status}` as any)}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.raidIcon}>⚔</Text>

        <View style={styles.infoCard}>
          <Text style={styles.label}>Dungeon</Text>
          <Text style={styles.value}>{session.gymName}</Text>
          {session.gymAddress && (
            <Text style={styles.subValue}>
              {session.gymAddress}, {session.gymCity}
            </Text>
          )}

          <Text style={styles.label}>Time</Text>
          <Text style={styles.value}>
            {formatSessionTime(session.scheduledAt)}
          </Text>

          {session.note && (
            <>
              <Text style={styles.label}>Note</Text>
              <Text style={styles.value}>{session.note}</Text>
            </>
          )}

          <Text style={styles.label}>Short Code</Text>
          <Text style={styles.shortCode}>{session.shortCode}</Text>
        </View>

        <Text style={styles.sectionTitle}>Party</Text>
        {session.members.map((member) => (
          <View key={member.userId} style={styles.memberRow}>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>
                {member.isCurrentUser
                  ? "You"
                  : member.nickname ?? member.generatedName}
              </Text>
              {member.nickname && !member.isCurrentUser && (
                <Text style={styles.memberSubname}>
                  {member.generatedName}
                </Text>
              )}
            </View>
            <Text style={styles.memberLevel}>Lv.{member.level}</Text>
            <View
              style={[
                styles.memberStatusBadge,
                {
                  backgroundColor:
                    (STATUS_COLORS[member.status] ?? COLORS.muted) + "20",
                },
              ]}
            >
              <Text
                style={[
                  styles.memberStatusText,
                  {
                    color: STATUS_COLORS[member.status] ?? COLORS.muted,
                  },
                ]}
              >
                {member.status}
              </Text>
            </View>
          </View>
        ))}

        {/* Live Sends Feed */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
          {t("session.sends")}
        </Text>
        {sends && sends.length > 0 ? (
          sends.map((send) => <SendRow key={send._id} send={send} />)
        ) : (
          <View style={styles.emptySends}>
            <Text style={styles.emptySendsText}>
              {t("session.no_sends")}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      {isSessionActive && (
        <Pressable
          style={styles.fab}
          onPress={() => setShowLogSheet(true)}
        >
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      )}

      {/* Log Climb Modal */}
      <LogClimbSheet
        visible={showLogSheet}
        onDismiss={() => setShowLogSheet(false)}
        sessionId={id as Id<"sessions">}
        gymId={session.gymId}
        gradeSystem={gradeSystem}
      />
    </View>
  );
}

// ─── Modal Styles ─────────────────────────────────────────────
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomWidth: 0,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
  },
  closeButton: {
    fontSize: 18,
    color: COLORS.muted,
    fontWeight: "bold",
    padding: 4,
  },
  toastContainer: {
    backgroundColor: COLORS.success + "20",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    alignItems: "center",
  },
  xpToast: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.success,
  },
  eventToast: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 4,
  },
  gradePicker: {
    maxHeight: 48,
    marginBottom: 20,
  },
  gradePickerContent: {
    alignItems: "center",
    gap: 6,
    paddingRight: 16,
  },
  gradeChip: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  gradeChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  gradeChipText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  gradeChipTextActive: {
    color: COLORS.bg,
  },
  toggleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  toggleChip: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  toggleChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  toggleChipText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },
  toggleChipTextActive: {
    color: COLORS.bg,
  },
  logButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  logButtonDisabled: {
    opacity: 0.4,
  },
  logButtonText: {
    color: COLORS.bg,
    fontWeight: "bold",
    fontSize: 18,
  },
});

// ─── Screen Styles ────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: COLORS.bg,
  },
  backArrow: {
    fontSize: 24,
    color: COLORS.text,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
  },
  statusBadge: {
    backgroundColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  raidIcon: {
    fontSize: 48,
    textAlign: "center",
    marginVertical: 16,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "600",
  },
  subValue: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 2,
  },
  shortCode: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
    fontFamily: "SpaceMono",
    letterSpacing: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 12,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.text,
  },
  memberSubname: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  memberLevel: {
    fontSize: 13,
    color: COLORS.muted,
    marginRight: 10,
  },
  memberStatusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  memberStatusText: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 8,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.bg,
  },
  // ─── Sends Feed ─────────────────────────────────────────
  sendRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendGradeChip: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 12,
  },
  sendGradeText: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.bg,
  },
  sendInfo: {
    flex: 1,
  },
  sendUserName: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 2,
  },
  sendMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sendTypeBadge: {
    backgroundColor: COLORS.success + "20",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sendTypeBadgeAttempt: {
    backgroundColor: COLORS.primary + "20",
  },
  sendTypeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.text,
    textTransform: "uppercase",
  },
  sendDifficulty: {
    fontSize: 11,
    color: COLORS.muted,
    textTransform: "capitalize",
  },
  sendRight: {
    alignItems: "flex-end",
  },
  sendXp: {
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.success,
  },
  sendTime: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  emptySends: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptySendsText: {
    fontSize: 14,
    color: COLORS.muted,
  },
  // ─── FAB ────────────────────────────────────────────────
  fab: {
    position: "absolute",
    bottom: 32,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  fabText: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.bg,
    marginTop: -2,
  },
});
