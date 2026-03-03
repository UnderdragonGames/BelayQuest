import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { t } from "@/lib/copy/en";

const COLORS = {
  bg: "#1a1a2e",
  primary: "#f4a261",
  text: "#eaeaea",
  muted: "#666680",
  card: "#16213e",
  border: "#2a2a4a",
  danger: "#e76f51",
  success: "#2a9d8f",
};

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

export default function QuestsScreen() {
  const router = useRouter();
  const upcoming = useQuery(api.sessions.myUpcoming);
  const quickRaidMutation = useMutation(api.sessions.quickRaid);

  const respondToInvite = useMutation(api.sessions.respondToInvite);

  const handleQuickRaid = async () => {
    try {
      const result = await quickRaidMutation();
      router.push({
        pathname: "/create/raid",
        params: {
          quickRaidSessionId: result.sessionId,
          quickRaidGymName: result.gymName,
          quickRaidScheduledAt: String(result.scheduledAt),
          quickRaidGuildName: result.guildName,
          quickRaidInvitedMembers: JSON.stringify(result.invitedMembers),
        },
      });
    } catch (error: any) {
      const msg = error?.message ?? "";
      if (msg.includes("No guild")) {
        alert(t("raid.quickraid.no_guild"));
      } else if (msg.includes("No favorite gyms")) {
        alert(t("raid.quickraid.no_gym"));
      } else {
        throw error;
      }
    }
  };

  const handleAccept = async (sessionId: string) => {
    await respondToInvite({
      sessionId: sessionId as any,
      response: "accepted",
    });
  };

  const handleDecline = async (sessionId: string) => {
    await respondToInvite({
      sessionId: sessionId as any,
      response: "declined",
    });
  };

  const hasUpcoming = upcoming && upcoming.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("app.name")}</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.quickRaidButton} onPress={handleQuickRaid}>
            <Text style={styles.quickRaidIcon}>⚡</Text>
            <Text style={styles.quickRaidText}>{t("quickraid.button")}</Text>
          </Pressable>
          <Pressable
            style={styles.createButton}
            onPress={() => router.push("/create/raid")}
          >
            <Text style={styles.createButtonText}>+</Text>
          </Pressable>
        </View>
      </View>

      {upcoming === undefined ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : !hasUpcoming ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{t("empty.quests")}</Text>
          <Text style={styles.emptySubtext}>{t("empty.quests.cta")}</Text>
          <Pressable
            style={styles.ctaButton}
            onPress={() => router.push("/create/raid")}
          >
            <Text style={styles.ctaButtonText}>
              {t("action.create_raid")}
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={styles.sessionList}
          contentContainerStyle={styles.sessionListContent}
        >
          {upcoming.map((session) => {
            const otherMembers = session.members.filter(
              (m) => !m.isCurrentUser
            );
            const acceptedCount = session.members.filter(
              (m) => m.status === "accepted"
            ).length;

            return (
              <Pressable
                key={session._id}
                style={styles.sessionCard}
                onPress={() =>
                  router.push({
                    pathname: "/session/[id]",
                    params: { id: session._id },
                  })
                }
              >
                <View style={styles.sessionHeader}>
                  <Text style={styles.sessionTypeIcon}>⚔</Text>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionGym}>{session.gymName}</Text>
                    <Text style={styles.sessionTime}>
                      {formatSessionTime(session.scheduledAt)}
                    </Text>
                  </View>
                  <View style={styles.sessionStatusBadge}>
                    <Text style={styles.sessionStatusText}>
                      {t(
                        `session.status.${session.status}` as any
                      )}
                    </Text>
                  </View>
                </View>

                <View style={styles.sessionMembers}>
                  <Text style={styles.memberCount}>
                    {t("upcoming.you_plus", {
                      count: otherMembers.length,
                    })}
                  </Text>
                  <View style={styles.memberNames}>
                    {otherMembers.slice(0, 4).map((m, idx) => (
                      <Text key={idx} style={styles.memberNameText}>
                        {m.nickname ?? m.generatedName}
                        {idx < Math.min(otherMembers.length, 4) - 1
                          ? ", "
                          : ""}
                      </Text>
                    ))}
                    {otherMembers.length > 4 && (
                      <Text style={styles.memberNameText}>
                        {" "}+{otherMembers.length - 4} more
                      </Text>
                    )}
                  </View>
                </View>

                {session.note && (
                  <Text style={styles.sessionNote}>{session.note}</Text>
                )}

                {session.myStatus === "invited" && (
                  <View style={styles.inviteActions}>
                    <Pressable
                      style={styles.acceptButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleAccept(session._id);
                      }}
                    >
                      <Text style={styles.acceptButtonText}>
                        {t("upcoming.accept")}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={styles.declineButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDecline(session._id);
                      }}
                    >
                      <Text style={styles.declineButtonText}>
                        {t("upcoming.decline")}
                      </Text>
                    </Pressable>
                  </View>
                )}

                {session.myStatus === "accepted" && (
                  <View style={styles.statusRow}>
                    <Text style={styles.goingBadge}>
                      {t("upcoming.accepted")}
                    </Text>
                    <Text style={styles.attendeeCount}>
                      {acceptedCount} going
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
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
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  quickRaidButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: 4,
  },
  quickRaidIcon: {
    fontSize: 16,
  },
  quickRaidText: {
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  createButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  createButtonText: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.bg,
    marginTop: -2,
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
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.muted,
    marginBottom: 24,
  },
  ctaButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  ctaButtonText: {
    color: COLORS.bg,
    fontWeight: "bold",
    fontSize: 16,
  },
  // Session list
  sessionList: {
    flex: 1,
  },
  sessionListContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sessionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  sessionTypeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionGym: {
    fontSize: 17,
    fontWeight: "bold",
    color: COLORS.text,
  },
  sessionTime: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 2,
  },
  sessionStatusBadge: {
    backgroundColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sessionStatusText: {
    fontSize: 11,
    color: COLORS.muted,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  sessionMembers: {
    marginBottom: 8,
  },
  memberCount: {
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 4,
  },
  memberNames: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  memberNameText: {
    fontSize: 13,
    color: COLORS.text,
  },
  sessionNote: {
    fontSize: 13,
    color: COLORS.muted,
    fontStyle: "italic",
    marginBottom: 8,
  },
  inviteActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.bg,
  },
  declineButton: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  declineButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.muted,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  goingBadge: {
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.success,
  },
  attendeeCount: {
    fontSize: 12,
    color: COLORS.muted,
  },
});
