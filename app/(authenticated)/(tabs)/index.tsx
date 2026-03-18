import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { t } from "@/lib/copy/en";
import { COLORS } from "@/lib/theme";
import { PixelIcon } from "@/components/PixelIcon";
import { ParchmentPanel } from "@/components/ParchmentPanel";
import { SectionHeader } from "@/components/SectionHeader";
import { StoneButton } from "@/components/StoneButton";

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
  const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();
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
          quickRaidShortCode: result.shortCode,
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
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <Text style={styles.title}>{t("app.name")}</Text>
      </View>

      {upcoming === undefined ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : !hasUpcoming ? (
        <View style={styles.emptyState}>
          <PixelIcon name="scroll" size={64} style={styles.emptyIcon} />
          <Text style={styles.emptyText}>{t("empty.quests")}</Text>
          <Text style={styles.emptySubtext}>{t("empty.quests.cta")}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.sessionList}
          contentContainerStyle={styles.sessionListContent}
        >
          <SectionHeader title="Upcoming Raids" />

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
                onPress={() =>
                  router.push({
                    pathname: "/session/[id]",
                    params: { id: session._id },
                  })
                }
              >
                <ParchmentPanel style={styles.cardPanel}>
                  <View style={styles.sessionHeader}>
                    <PixelIcon name="swords" size={28} style={styles.sessionTypeIcon} />
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionGym}>{session.gymName}</Text>
                      <Text style={styles.sessionTime}>
                        {formatSessionTime(session.scheduledAt)}
                      </Text>
                    </View>
                    <View style={styles.sessionStatusBadge}>
                      <Text style={styles.sessionStatusText}>
                        {t(`session.status.${session.status}` as any)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.sessionMembers}>
                    <Text style={styles.memberCount}>
                      {t("upcoming.you_plus", { count: otherMembers.length })}
                    </Text>
                    <View style={styles.memberNames}>
                      {otherMembers.slice(0, 4).map((m, idx) => (
                        <Text key={idx} style={styles.memberNameText}>
                          {m.nickname ?? m.generatedName}
                          {idx < Math.min(otherMembers.length, 4) - 1 ? ", " : ""}
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
                      <View style={styles.inviteButtonWrap}>
                        <StoneButton
                          label={t("upcoming.accept")}
                          onPress={() => handleAccept(session._id)}
                        />
                      </View>
                      <View style={styles.inviteButtonWrap}>
                        <StoneButton
                          label={t("upcoming.decline")}
                          onPress={() => handleDecline(session._id)}
                        />
                      </View>
                    </View>
                  )}

                  {session.myStatus === "accepted" && (
                    <View style={styles.statusRow}>
                      <PixelIcon name="checkmark" size={16} />
                      <Text style={styles.goingBadge}>
                        {t("upcoming.accepted")}
                      </Text>
                      <Text style={styles.attendeeCount}>
                        {acceptedCount} going
                      </Text>
                    </View>
                  )}
                </ParchmentPanel>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Bottom action bar — thumb-level */}
      <View style={[styles.bottomActions, { paddingBottom: Math.max(12, bottomInset) }]}>
        <StoneButton label={t("quickraid.button")} onPress={handleQuickRaid} style={{ flex: 1 }} />
        <StoneButton
          label={t("action.create_raid")}
          onPress={() => router.push("/create/raid")}
          style={{ flex: 1 }}
        />
      </View>
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
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  title: {
    fontFamily: "VT323",
    fontSize: 28,
    color: COLORS.primary,
  },
  bottomActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 2,
    borderTopColor: COLORS.border,
  },
  actionButtonWrap: {
    flex: 1,
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
    gap: 12,
  },
  emptyIcon: {
    marginBottom: 8,
    opacity: 0.6,
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
    marginBottom: 8,
  },
  // Session list
  sessionList: {
    flex: 1,
  },
  sessionListContent: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  cardPanel: {
    marginBottom: 12,
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  sessionTypeIcon: {
    marginRight: 10,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionGym: {
    fontFamily: "VT323",
    fontSize: 20,
    color: COLORS.bg,
  },
  sessionTime: {
    fontFamily: "VT323",
    fontSize: 16,
    color: "#6b4e2a",
    marginTop: 1,
  },
  sessionStatusBadge: {
    backgroundColor: COLORS.border,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sessionStatusText: {
    fontFamily: "VT323",
    fontSize: 14,
    color: COLORS.text,
    textTransform: "uppercase",
  },
  sessionMembers: {
    marginBottom: 8,
  },
  memberCount: {
    fontFamily: "VT323",
    fontSize: 16,
    color: "#6b4e2a",
    marginBottom: 2,
  },
  memberNames: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  memberNameText: {
    fontFamily: "VT323",
    fontSize: 16,
    color: COLORS.bg,
  },
  sessionNote: {
    fontFamily: "VT323",
    fontSize: 15,
    color: "#6b4e2a",
    fontStyle: "italic",
    marginBottom: 8,
  },
  inviteActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    justifyContent: "center",
  },
  inviteButtonWrap: {
    flex: 1,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  goingBadge: {
    fontFamily: "VT323",
    fontSize: 17,
    color: COLORS.success,
  },
  attendeeCount: {
    fontFamily: "VT323",
    fontSize: 15,
    color: "#6b4e2a",
  },
});
