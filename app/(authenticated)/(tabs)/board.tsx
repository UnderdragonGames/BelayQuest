import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { t } from "@/lib/copy/en";
import { COLORS } from "@/lib/theme";
import { PixelIcon } from "@/components/PixelIcon";
import { StoneButton } from "@/components/StoneButton";

const CLIMBING_TYPE_ICONS: Record<string, string> = {
  boulder: "🪨",
  lead: "🧗",
  top_rope: "🔗",
};

const CLIMBING_TYPE_LABELS: Record<string, string> = {
  boulder: "Boulder",
  lead: "Lead",
  top_rope: "Top Rope",
};

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "boulder", label: "Boulder" },
  { value: "lead", label: "Lead" },
  { value: "top_rope", label: "Top Rope" },
];

function formatSessionTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let dayStr: string;
  if (date.toDateString() === now.toDateString()) {
    dayStr = "Today";
  } else if (date.toDateString() === tomorrow.toDateString()) {
    dayStr = "Tomorrow";
  } else {
    dayStr = date.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  const timeStr = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${dayStr} at ${timeStr}`;
}

type Quest = {
  _id: string;
  gymId: string;
  gymName: string;
  scheduledAt: number;
  climbingType?: string;
  gradeRange?: { min: string; max: string };
  capacity?: number;
  checkInMessage?: string;
  note?: string;
  creatorName: string;
  creatorLevel: number;
  memberCount: number;
  alreadyJoined: boolean;
};

function QuestCard({
  quest,
  onJoin,
}: {
  quest: Quest;
  onJoin: (id: string) => void;
}) {
  const router = useRouter();
  const [joining, setJoining] = useState(false);

  const handleJoin = async (e: any) => {
    e.stopPropagation();
    setJoining(true);
    try {
      await onJoin(quest._id);
    } finally {
      setJoining(false);
    }
  };

  const spotsLeft =
    quest.capacity !== undefined
      ? quest.capacity - quest.memberCount
      : null;

  return (
    <Pressable
      style={styles.questCard}
      onPress={() =>
        router.push({
          pathname: "/session/[id]",
          params: { id: quest._id },
        })
      }
    >
      <View style={styles.questHeader}>
        <View style={styles.questTypeRow}>
          {quest.climbingType && (
            <Text style={styles.climbingTypeIcon}>
              {CLIMBING_TYPE_ICONS[quest.climbingType] ?? "🧗"}
            </Text>
          )}
          <View style={styles.questMeta}>
            <Text style={styles.questCreator}>
              {quest.creatorName}{" "}
              <Text style={styles.questCreatorLevel}>
                Lv.{quest.creatorLevel}
              </Text>
            </Text>
            {quest.climbingType && (
              <Text style={styles.questSubtype}>
                {CLIMBING_TYPE_LABELS[quest.climbingType]}
                {quest.gradeRange
                  ? `  ·  ${quest.gradeRange.min} – ${quest.gradeRange.max}`
                  : ""}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.questCapacity}>
          {quest.capacity !== undefined && (
            <Text
              style={[
                styles.capacityText,
                spotsLeft === 0 && styles.capacityFull,
              ]}
            >
              {quest.memberCount}/{quest.capacity}
            </Text>
          )}
        </View>
      </View>

      <Text style={styles.questTime}>{formatSessionTime(quest.scheduledAt)}</Text>

      {(quest.checkInMessage || quest.note) && (
        <Text style={styles.questNote} numberOfLines={2}>
          {quest.checkInMessage ?? quest.note}
        </Text>
      )}

      <View style={styles.questFooter}>
        {quest.alreadyJoined ? (
          <View style={styles.joinedBadge}>
            <Text style={styles.joinedText}>✓ Joined</Text>
          </View>
        ) : spotsLeft === 0 ? (
          <View style={[styles.joinedBadge, styles.fullBadge]}>
            <Text style={styles.fullText}>Full</Text>
          </View>
        ) : (
          <Pressable
            style={[styles.joinButton, joining && styles.joinButtonDisabled]}
            onPress={handleJoin}
            disabled={joining}
          >
            <Text style={styles.joinButtonText}>
              {joining ? "Joining..." : t("action.join_quest")}
            </Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

export default function QuestBoardScreen() {
  const { top: topInset } = useSafeAreaInsets();
  const router = useRouter();
  const [filter, setFilter] = useState<string>("all");

  const questGroups = useQuery(api.sessions.questBoard);
  const joinQuestMutation = useMutation(api.sessions.joinQuest);

  const handleJoin = async (sessionId: string) => {
    try {
      await joinQuestMutation({ sessionId: sessionId as any });
    } catch (error: any) {
      alert(error?.message ?? "Failed to join quest");
    }
  };

  const filteredGroups = (questGroups ?? []).map((group) => ({
    ...group,
    quests: group.quests.filter(
      (q: Quest) => filter === "all" || q.climbingType === filter
    ),
  })).filter((g) => g.quests.length > 0);

  const totalQuests = filteredGroups.reduce(
    (sum, g) => sum + g.quests.length,
    0
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <Text style={styles.title}>Quest Board</Text>
        <Pressable
          style={styles.postButton}
          onPress={() => router.push("/create/quest")}
        >
          <Text style={styles.postButtonText}>+ {t("action.post_quest")}</Text>
        </Pressable>
      </View>

      {/* Filter bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterBarContent}
      >
        {FILTER_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            style={[
              styles.filterChip,
              filter === opt.value && styles.filterChipActive,
            ]}
            onPress={() => setFilter(opt.value)}
          >
            <Text
              style={[
                styles.filterChipText,
                filter === opt.value && styles.filterChipTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {questGroups === undefined ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : totalQuests === 0 ? (
        <View style={styles.emptyState}>
          <PixelIcon name="signpost" size={64} style={styles.emptyIcon} />
          <Text style={styles.emptyText}>{t("empty.board")}</Text>
          <Text style={styles.emptySubtext}>{t("empty.board.cta")}</Text>
          <StoneButton
            label={t("action.post_quest")}
            onPress={() => router.push("/create/quest")}
          />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {filteredGroups.map((group) => (
            <View key={group.gymId} style={styles.gymSection}>
              <Text style={styles.gymHeader}>{group.gymName}</Text>
              {group.quests.map((quest: Quest) => (
                <QuestCard
                  key={quest._id}
                  quest={quest}
                  onJoin={handleJoin}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontFamily: "VT323",
    fontSize: 28,
    color: COLORS.primary,
  },
  postButton: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  postButtonText: {
    fontFamily: "VT323",
    fontSize: 18,
    color: COLORS.text,
  },
  filterBar: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterBarContent: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
    flexDirection: "row",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontFamily: "VT323",
    fontSize: 16,
    color: COLORS.muted,
  },
  filterChipTextActive: {
    color: COLORS.bg,
  },
  loadingState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.7,
  },
  emptyText: {
    fontFamily: "VT323",
    fontSize: 22,
    color: COLORS.text,
    textAlign: "center",
  },
  emptySubtext: {
    fontFamily: "VT323",
    fontSize: 18,
    color: COLORS.muted,
    textAlign: "center",
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 8,
  },
  gymSection: {
    marginBottom: 24,
  },
  gymHeader: {
    fontFamily: "VT323",
    fontSize: 16,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 8,
  },
  questCard: {
    backgroundColor: COLORS.card,
    borderRadius: 2,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  questHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  questTypeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    gap: 10,
  },
  climbingTypeIcon: {
    fontSize: 28,
    marginTop: 2,
  },
  questMeta: {
    flex: 1,
  },
  questCreator: {
    fontFamily: "VT323",
    fontSize: 18,
    color: COLORS.text,
  },
  questCreatorLevel: {
    fontFamily: "VT323",
    fontSize: 15,
    color: COLORS.primary,
  },
  questSubtype: {
    fontFamily: "VT323",
    fontSize: 15,
    color: COLORS.muted,
    marginTop: 2,
  },
  questCapacity: {
    alignItems: "flex-end",
  },
  capacityText: {
    fontFamily: "VT323",
    fontSize: 16,
    color: COLORS.success,
  },
  capacityFull: {
    color: COLORS.danger,
  },
  questTime: {
    fontFamily: "VT323",
    fontSize: 15,
    color: COLORS.muted,
    marginBottom: 6,
  },
  questNote: {
    fontFamily: "VT323",
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 8,
    opacity: 0.8,
  },
  questFooter: {
    marginTop: 4,
    alignItems: "flex-start",
  },
  joinButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    fontFamily: "VT323",
    fontSize: 18,
    color: COLORS.bg,
  },
  joinedBadge: {
    backgroundColor: COLORS.success,
    borderRadius: 2,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  joinedText: {
    fontFamily: "VT323",
    fontSize: 15,
    color: COLORS.text,
  },
  fullBadge: {
    backgroundColor: COLORS.border,
  },
  fullText: {
    fontFamily: "VT323",
    fontSize: 15,
    color: COLORS.muted,
  },
});
