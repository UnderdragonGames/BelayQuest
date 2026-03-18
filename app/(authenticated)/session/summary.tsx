import { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { COLORS } from "@/lib/theme";
import { levelProgress, xpForLevel, levelFromXp } from "@/lib/xp/calculator";
import { ParchmentPanel } from "@/components/ParchmentPanel";
import { StoneButton } from "@/components/StoneButton";
import { PixelIcon } from "@/components/PixelIcon";
import { SectionHeader } from "@/components/SectionHeader";
import { XpBar } from "@/components/XpBar";
import { Avatar } from "@/components/Avatar";

const EVENT_ICONS: Record<string, string> = {
  grade_breakthrough: "flag",
  volume_pr: "boulder",
  level_up: "crown",
  tape_earned: "helmet",
  boss_defeat: "swords",
};

const EVENT_LABELS: Record<string, (meta: any) => string> = {
  grade_breakthrough: (m) =>
    `New max${m?.previousMax ? ` (was ${m.previousMax})` : ""}: ${m?.grade ?? ""}`,
  volume_pr: (m) => `Volume PR: ${m?.count ?? "?"} × ${m?.grade ?? ""}`,
  level_up: (m) => `Leveled up! ${m?.oldLevel ?? "?"} → ${m?.newLevel ?? "?"}`,
  tape_earned: (m) => `Tape earned on ${m?.grade ?? "a tough route"}`,
  boss_defeat: () => "Boss defeated!",
};

export default function SessionSummaryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessionId = id as Id<"sessions">;

  const summary = useQuery(api.sessions.sessionSummary, { sessionId });
  const matchFromQuest = useMutation(api.connections.matchFromQuest);
  const [matchingResponses, setMatchingResponses] = useState<
    Record<string, "yes" | "no" | "loading">
  >({});

  const handleMatch = useCallback(
    async (toUserId: Id<"users">, response: "yes" | "no") => {
      setMatchingResponses((prev) => ({ ...prev, [toUserId]: "loading" }));
      try {
        const result = await matchFromQuest({ sessionId, toUserId, response });
        setMatchingResponses((prev) => ({ ...prev, [toUserId]: response }));
        if (result.matched) {
          // Brief acknowledgment handled by UI state — connection created
        }
      } catch {
        setMatchingResponses((prev) => {
          const next = { ...prev };
          delete next[toUserId];
          return next;
        });
      }
    },
    [sessionId, matchFromQuest]
  );

  const handleDone = useCallback(() => {
    router.replace("/(tabs)/");
  }, [router]);

  if (summary === undefined) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (summary === null) {
    return (
      <View style={styles.loading}>
        <Text style={styles.emptyText}>Session not found</Text>
      </View>
    );
  }

  const totalXp = summary.userTotalXp;
  const level = summary.userLevel;
  const progress = levelProgress(totalXp);
  const xpToNext = xpForLevel(level + 1) - totalXp;

  const levelUpEvents = summary.events.filter((e) => e.type === "level_up");
  const otherEvents = summary.events.filter((e) => e.type !== "level_up");

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <PixelIcon name="swords" size={36} />
        <Text style={styles.title}>SESSION COMPLETE</Text>
        <Text style={styles.subtitle}>
          {summary.gymName} · {formatDate(summary.scheduledAt)}
        </Text>
      </View>

      {/* XP earned */}
      <ParchmentPanel style={styles.xpPanel}>
        <Text style={styles.xpEarnedLabel}>XP EARNED</Text>
        <Text style={styles.xpEarnedValue}>+{summary.totalXpEarned}</Text>
        <Text style={styles.levelLabel}>Level {level}</Text>
        <XpBar
          progress={progress}
          label={`${xpToNext.toLocaleString()} XP to next level`}
        />
      </ParchmentPanel>

      {/* Level up events */}
      {levelUpEvents.map((e, i) => (
        <View key={i} style={styles.levelUpBanner}>
          <PixelIcon name="crown" size={24} />
          <Text style={styles.levelUpText}>
            LEVEL UP! {e.metadata?.oldLevel} → {e.metadata?.newLevel}
          </Text>
          <PixelIcon name="crown" size={24} />
        </View>
      ))}

      {/* Other events */}
      {otherEvents.length > 0 && (
        <>
          <SectionHeader title="ACHIEVEMENTS" />
          {otherEvents.map((e, i) => {
            const icon = EVENT_ICONS[e.type] ?? "star";
            const labelFn = EVENT_LABELS[e.type];
            const label = labelFn ? labelFn(e.metadata) : e.type;
            return (
              <View key={i} style={styles.eventRow}>
                <PixelIcon name={icon as any} size={24} />
                <Text style={styles.eventText}>{label}</Text>
              </View>
            );
          })}
        </>
      )}

      {/* Sends log */}
      {summary.sends.length > 0 && (
        <>
          <SectionHeader title="CLIMBS" />
          {summary.sends.map((send) => (
            <View key={send._id} style={styles.sendRow}>
              <PixelIcon
                name={send.gradeSystem === "v_scale" ? "boulder" : "rope"}
                size={20}
              />
              <View style={styles.sendInfo}>
                <Text style={styles.sendGrade}>{send.grade}</Text>
                <Text style={styles.sendType}>
                  {send.type === "send" ? "Send" : "Attempt"}
                </Text>
              </View>
              <Text style={styles.sendXp}>+{send.xpAwarded} XP</Text>
            </View>
          ))}
        </>
      )}

      {summary.sends.length === 0 && (
        <View style={styles.noSends}>
          <PixelIcon name="scroll" size={32} style={{ opacity: 0.4 }} />
          <Text style={styles.noSendsText}>No climbs logged this session</Text>
          <Pressable style={styles.logMoreButton} onPress={() => router.back()}>
            <Text style={styles.logMoreText}>+ LOG CLIMBS</Text>
          </Pressable>
        </View>
      )}

      {/* Quest matching */}
      {summary.sessionType === "quest" && summary.matchCandidates.length > 0 && (
        <>
          <SectionHeader title="CLIMB TOGETHER AGAIN?" />
          <Text style={styles.matchHint}>
            Say yes — if they say yes too, you'll connect!
          </Text>
          {summary.matchCandidates.map((candidate) => {
            const myResponse =
              matchingResponses[candidate.userId] ??
              candidate.myMatchResponse;
            const isLoading = myResponse === "loading";
            const isYes = myResponse === "yes";
            const isNo = myResponse === "no";
            const isDone = isYes || isNo;

            return (
              <View key={candidate.userId} style={styles.matchCard}>
                <Avatar seed={candidate.userId} size={40} />
                <View style={styles.matchInfo}>
                  <Text style={styles.matchName}>{candidate.generatedName}</Text>
                  <Text style={styles.matchLevel}>Lv.{candidate.level}</Text>
                </View>
                {isLoading ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : isDone ? (
                  <View style={styles.matchResult}>
                    <PixelIcon
                      name={isYes ? "checkmark" : "back"}
                      size={20}
                    />
                    <Text
                      style={[
                        styles.matchResultText,
                        isYes ? styles.matchYesText : styles.matchNoText,
                      ]}
                    >
                      {isYes ? "YES!" : "PASSED"}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.matchButtons}>
                    <Pressable
                      style={[styles.matchBtn, styles.matchBtnYes]}
                      onPress={() =>
                        handleMatch(candidate.userId as Id<"users">, "yes")
                      }
                    >
                      <Text style={styles.matchBtnText}>YES</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.matchBtn, styles.matchBtnNo]}
                      onPress={() =>
                        handleMatch(candidate.userId as Id<"users">, "no")
                      }
                    >
                      <Text style={styles.matchBtnText}>NOT NOW</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })}
        </>
      )}

      {/* Spacer + Done button */}
      <View style={styles.footer}>
        {summary.sends.length > 0 && (
          <Pressable style={styles.logMoreButton} onPress={() => router.back()}>
            <Text style={styles.logMoreText}>+ LOG MORE CLIMBS</Text>
          </Pressable>
        )}
        <StoneButton label="DONE" onPress={handleDone} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 20,
  },
  loading: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontFamily: "VT323",
    fontSize: 20,
    color: COLORS.muted,
  },

  // ─── Header ─────────────────────────────────────────────────
  header: {
    alignItems: "center",
    marginBottom: 20,
    gap: 4,
  },
  title: {
    fontFamily: "VT323",
    fontSize: 32,
    color: COLORS.primary,
    letterSpacing: 3,
  },
  subtitle: {
    fontFamily: "VT323",
    fontSize: 18,
    color: COLORS.muted,
  },

  // ─── XP Panel ───────────────────────────────────────────────
  xpPanel: {
    marginBottom: 12,
    alignItems: "center",
  },
  xpEarnedLabel: {
    fontFamily: "VT323",
    fontSize: 16,
    color: COLORS.bg,
    opacity: 0.6,
    letterSpacing: 2,
  },
  xpEarnedValue: {
    fontFamily: "VT323",
    fontSize: 48,
    color: COLORS.bg,
    lineHeight: 52,
  },
  levelLabel: {
    fontFamily: "VT323",
    fontSize: 20,
    color: COLORS.bg,
    marginTop: 4,
    marginBottom: 8,
  },

  // ─── Level up ───────────────────────────────────────────────
  levelUpBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: COLORS.cardSelected,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 2,
    paddingVertical: 12,
    marginBottom: 8,
  },
  levelUpText: {
    fontFamily: "VT323",
    fontSize: 24,
    color: COLORS.primary,
    letterSpacing: 2,
  },

  // ─── Events ─────────────────────────────────────────────────
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 2,
    padding: 12,
    marginBottom: 6,
  },
  eventText: {
    fontFamily: "VT323",
    fontSize: 18,
    color: COLORS.text,
    flex: 1,
  },

  // ─── Sends ──────────────────────────────────────────────────
  sendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 2,
    padding: 10,
    marginBottom: 6,
  },
  sendInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sendGrade: {
    fontFamily: "VT323",
    fontSize: 22,
    color: COLORS.text,
  },
  sendType: {
    fontFamily: "VT323",
    fontSize: 16,
    color: COLORS.muted,
  },
  sendXp: {
    fontFamily: "VT323",
    fontSize: 18,
    color: COLORS.xp,
  },

  // ─── No sends ───────────────────────────────────────────────
  noSends: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  noSendsText: {
    fontFamily: "VT323",
    fontSize: 18,
    color: COLORS.muted,
    textAlign: "center",
  },

  // ─── Match hint ─────────────────────────────────────────────
  matchHint: {
    fontFamily: "VT323",
    fontSize: 17,
    color: COLORS.muted,
    textAlign: "center",
    marginBottom: 12,
  },

  // ─── Match cards ────────────────────────────────────────────
  matchCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 2,
    padding: 12,
    marginBottom: 8,
  },
  matchInfo: {
    flex: 1,
  },
  matchName: {
    fontFamily: "VT323",
    fontSize: 20,
    color: COLORS.text,
  },
  matchLevel: {
    fontFamily: "VT323",
    fontSize: 16,
    color: COLORS.muted,
  },
  matchButtons: {
    flexDirection: "row",
    gap: 8,
  },
  matchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderRadius: 2,
    minWidth: 64,
    alignItems: "center",
  },
  matchBtnYes: {
    borderColor: COLORS.xp,
    backgroundColor: "#1e3828",
  },
  matchBtnNo: {
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  matchBtnText: {
    fontFamily: "VT323",
    fontSize: 16,
    color: COLORS.text,
  },
  matchResult: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  matchResultText: {
    fontFamily: "VT323",
    fontSize: 18,
  },
  matchYesText: {
    color: COLORS.xp,
  },
  matchNoText: {
    color: COLORS.muted,
  },

  // ─── Footer ─────────────────────────────────────────────────
  footer: {
    alignItems: "center",
    gap: 12,
    marginTop: 24,
  },
  logMoreButton: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 2,
    borderStyle: "dashed",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  logMoreText: {
    fontFamily: "VT323",
    fontSize: 18,
    color: COLORS.muted,
  },
});
