import { StyleSheet, Text, View, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import { t } from "@/lib/copy/en";

const COLORS = {
  bg: "#1a1a2e",
  primary: "#f4a261",
  text: "#eaeaea",
  muted: "#666680",
  card: "#16213e",
  border: "#2a2a4a",
  success: "#2a9d8f",
};

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

export default function CharacterScreen() {
  const { signOut } = useAuthActions();
  const stats = useQuery(api.progression.myStats);
  const recentSends = useQuery(api.progression.recentSends, { limit: 10 });
  const me = useQuery(api.users.me);

  if (stats === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (stats === null) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyText}>Sign in to view your character</Text>
      </View>
    );
  }

  const progressPercent = Math.round(stats.levelProgress * 100);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header Card */}
      <View style={styles.headerCard}>
        <Text style={styles.name}>
          {stats.generatedName ?? me?.generatedName ?? "Adventurer"}
        </Text>
        <Text style={styles.levelText}>Level {stats.level}</Text>

        {/* XP Progress Bar */}
        <View style={styles.progressBarBg}>
          <View
            style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
          />
        </View>
        <Text style={styles.xpText}>
          {stats.totalXp.toLocaleString()} XP ({stats.xpToNextLevel.toLocaleString()} to next level)
        </Text>

        {/* Status effect */}
        {stats.currentStatus && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {stats.currentStatus.type === "buff" ? "+" : "-"}{" "}
              {stats.currentStatus.effect}
            </Text>
          </View>
        )}
      </View>

      {/* Stats Grid */}
      <Text style={styles.sectionTitle}>{t("character.stats")}</Text>
      <View style={styles.statsGrid}>
        <StatCard label={t("character.sessions")} value="-" />
        <StatCard
          label={t("character.routes")}
          value={String(stats.totalSends)}
        />
        <StatCard
          label={t("character.max_route")}
          value={stats.maxGradeRoute ?? "-"}
        />
        <StatCard
          label={t("character.max_boulder")}
          value={stats.maxGradeBoulder ?? "-"}
        />
      </View>

      {/* Recent Sends */}
      <Text style={styles.sectionTitle}>{t("character.recent")}</Text>
      {recentSends && recentSends.length > 0 ? (
        recentSends.map((send) => (
          <View key={send._id} style={styles.sendRow}>
            <View style={styles.sendGradeChip}>
              <Text style={styles.sendGradeText}>{send.grade}</Text>
            </View>
            <View style={styles.sendInfo}>
              <Text style={styles.sendGym}>{send.gymName}</Text>
              <View style={styles.sendMeta}>
                <Text style={styles.sendType}>{send.type}</Text>
                {send.difficultyRating && (
                  <Text style={styles.sendDifficulty}>
                    {send.difficultyRating.replace("_", " ")}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.sendRight}>
              <Text style={styles.sendXp}>+{send.xpAwarded} XP</Text>
              <Text style={styles.sendDate}>
                {formatDate(send.climbedAt)}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No sends yet. Get climbing!</Text>
        </View>
      )}

      {/* Sign Out */}
      <Pressable style={styles.signOutButton} onPress={() => signOut()}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  // ─── Header Card ────────────────────────────────────────
  headerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    marginBottom: 24,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  levelText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 16,
  },
  progressBarBg: {
    width: "100%",
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  xpText: {
    fontSize: 13,
    color: COLORS.muted,
  },
  statusBadge: {
    backgroundColor: COLORS.success + "20",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.success,
  },
  // ─── Stats Grid ─────────────────────────────────────────
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    width: "48%",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    flexGrow: 1,
    flexBasis: "45%",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // ─── Recent Sends ──────────────────────────────────────
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
  sendGym: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 2,
  },
  sendMeta: {
    flexDirection: "row",
    gap: 8,
  },
  sendType: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.muted,
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
  sendDate: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.muted,
  },
  signOutButton: {
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  signOutText: {
    fontSize: 14,
    color: COLORS.muted,
  },
});
