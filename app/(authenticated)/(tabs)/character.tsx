import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import { t } from "@/lib/copy/en";
import { COLORS } from "@/lib/theme";
import { Avatar } from "@/components/Avatar";
import { XpBar } from "@/components/XpBar";
import { SectionHeader } from "@/components/SectionHeader";
import { PixelIcon } from "@/components/PixelIcon";
import { StoneButton } from "@/components/StoneButton";
import type { IconName } from "@/assets/images/icons";

const itemSlot = require("@/assets/images/ui/ItemSlotStone.webp");

// ─── Item icons map ────────────────────────────────────────────
const ITEM_ICON: Record<string, IconName> = {
  chalk: "potion",
  chalk_bag: "potion",
  liquid_chalk: "potion",
  tape: "scroll",
  carabiner: "compass",
  quickdraw: "rope",
  brush: "flag",
  energy_bar: "potion",
};

const ITEM_LABEL: Record<string, string> = {
  chalk: "Chalk",
  chalk_bag: "Chalk Bag",
  liquid_chalk: "Liquid Chalk",
  tape: "Tape",
  carabiner: "Carabiner",
  quickdraw: "Quickdraw",
  brush: "Brush",
  energy_bar: "Energy Bar",
};

// ─── StatCell ─────────────────────────────────────────────────
function StatCell({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: IconName;
}) {
  return (
    <View style={styles.statCell}>
      <View style={styles.statSlot}>
        <Image source={itemSlot} style={styles.slotBg} resizeMode="contain" />
        <PixelIcon name={icon} size={32} style={styles.slotIcon} />
      </View>
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

// ─── AchievementToast ─────────────────────────────────────────
// Shown briefly when a new achievement is detected.
function AchievementToast({
  title,
  description,
  visible,
  onDismiss,
}: {
  title: string;
  description: string;
  visible: boolean;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onDismiss}>
      <Pressable style={toastStyles.overlay} onPress={onDismiss}>
        <View style={toastStyles.card}>
          <Text style={toastStyles.banner}>ACHIEVEMENT UNLOCKED!</Text>
          <Text style={toastStyles.title}>{title}</Text>
          <Text style={toastStyles.desc}>{description}</Text>
        </View>
      </Pressable>
    </Modal>
  );
}

const toastStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 120,
    alignItems: "center",
  },
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 6,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: "center",
    maxWidth: 280,
  },
  banner: {
    fontFamily: "VT323",
    fontSize: 13,
    color: COLORS.primary,
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: {
    fontFamily: "VT323",
    fontSize: 24,
    color: COLORS.text,
    marginBottom: 2,
  },
  desc: {
    fontFamily: "VT323",
    fontSize: 14,
    color: COLORS.muted,
    textAlign: "center",
  },
});

// ─── CharacterScreen ──────────────────────────────────────────
export default function CharacterScreen() {
  const { top: topInset } = useSafeAreaInsets();
  const { signOut } = useAuthActions();
  const stats = useQuery(api.progression.myStats);
  const recentSends = useQuery(api.progression.recentSends, { limit: 10 });
  const achievements = useQuery(api.progression.myAchievements);
  const inventory = useQuery(api.inventory.myItems);
  const me = useQuery(api.users.me);

  // Achievement toast: detect newly-earned achievements
  const [toastQueue, setToastQueue] = useState<
    { title: string; description: string }[]
  >([]);
  const [toastVisible, setToastVisible] = useState(false);
  const prevAchievementCount = useRef<number | null>(null);

  useEffect(() => {
    if (achievements === undefined) return;
    const count = achievements.length;
    if (prevAchievementCount.current === null) {
      prevAchievementCount.current = count;
      return;
    }
    if (count > prevAchievementCount.current) {
      // New achievements earned while screen is open
      const newOnes = achievements.slice(0, count - prevAchievementCount.current);
      setToastQueue((q) => [
        ...q,
        ...newOnes.map((a) => ({ title: a.title, description: a.description })),
      ]);
    }
    prevAchievementCount.current = count;
  }, [achievements?.length]);

  // Drain toast queue one at a time
  useEffect(() => {
    if (toastQueue.length > 0 && !toastVisible) {
      setToastVisible(true);
    }
  }, [toastQueue, toastVisible]);

  const dismissToast = () => {
    setToastVisible(false);
    setToastQueue((q) => q.slice(1));
  };

  const currentToast = toastQueue[0];

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

  const displayName = stats.generatedName ?? me?.generatedName ?? "Adventurer";
  const userId = me?._id ?? "default";

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.contentContainer, { paddingTop: topInset + 16 }]}
      >
        {/* Header: Avatar + socketed XP bar */}
        <View style={styles.header}>
          <Text style={styles.name}>{displayName}</Text>
          <View style={styles.portraitRow}>
            <Avatar seed={userId} size={120} avatarUrl={me?.avatarUrl} />
            <View style={styles.barSocket}>
              <Text style={styles.levelText}>Level {stats.level}</Text>
              <XpBar
                progress={stats.levelProgress}
                label={`${stats.totalXp.toLocaleString()} XP  /  ${stats.xpToNextLevel.toLocaleString()} to next`}
              />
            </View>
          </View>
        </View>

        {/* Buff badge */}
        {stats.currentStatus && (
          <View style={styles.buffBadge}>
            <PixelIcon name="potion" size={18} />
            <Text style={styles.buffText}>{stats.currentStatus.effect}</Text>
          </View>
        )}

        {/* Stats */}
        <SectionHeader title={t("character.stats")} />
        <View style={styles.statsGrid}>
          <StatCell
            label={t("character.sessions")}
            value="-"
            icon="compass"
          />
          <StatCell
            label={t("character.routes")}
            value={String(stats.totalSends)}
            icon="flag"
          />
          <StatCell
            label={t("character.max_route")}
            value={stats.maxGradeRoute ?? "-"}
            icon="rope"
          />
          <StatCell
            label={t("character.max_boulder")}
            value={stats.maxGradeBoulder ?? "-"}
            icon="boulder"
          />
        </View>

        {/* Recent Sends */}
        <SectionHeader title={t("character.recent")} />
        {recentSends && recentSends.length > 0 ? (
          <View style={styles.sendList}>
            {recentSends.map((send, i) => (
              <View
                key={send._id}
                style={[styles.sendRow, i > 0 && styles.sendRowBorder]}
              >
                <View style={styles.gradeChip}>
                  <Text style={styles.gradeText}>{send.grade}</Text>
                </View>
                <View style={styles.sendInfo}>
                  <Text style={styles.sendGym} numberOfLines={1}>
                    {send.gymName}
                  </Text>
                  <Text style={styles.sendMeta}>
                    {send.type}
                    {send.difficultyRating
                      ? ` · ${send.difficultyRating.replace("_", " ")}`
                      : ""}
                  </Text>
                </View>
                <View style={styles.sendRight}>
                  <Text style={styles.sendXp}>+{send.xpAwarded}</Text>
                  <Text style={styles.sendDate}>
                    {formatDate(send.climbedAt)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No sends yet. Get climbing!</Text>
        )}

        {/* Inventory */}
        <SectionHeader title="Inventory" />
        {inventory && inventory.length > 0 ? (
          <View style={styles.inventoryGrid}>
            {inventory.map((group) => (
              <View key={group.itemType} style={styles.inventoryItem}>
                <View style={styles.inventorySlot}>
                  <Image
                    source={itemSlot}
                    style={styles.slotBg}
                    resizeMode="contain"
                  />
                  <PixelIcon
                    name={ITEM_ICON[group.itemType] ?? "potion"}
                    size={28}
                    style={styles.slotIcon}
                  />
                  {group.count > 1 && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countText}>{group.count}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.itemLabel}>
                  {ITEM_LABEL[group.itemType] ?? group.itemType}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>
            No items yet. Earn them through achievements!
          </Text>
        )}

        {/* Achievements */}
        <SectionHeader title="Achievements" />
        {achievements && achievements.length > 0 ? (
          <View style={styles.achievementList}>
            {achievements.map((a, i) => (
              <View
                key={a._id}
                style={[styles.achievementRow, i > 0 && styles.achievementBorder]}
              >
                <View style={styles.achievementIcon}>
                  <PixelIcon name="flag" size={20} />
                </View>
                <View style={styles.achievementInfo}>
                  <Text style={styles.achievementTitle}>{a.title}</Text>
                  <Text style={styles.achievementDesc}>{a.description}</Text>
                </View>
                <Text style={styles.achievementDate}>
                  {formatDate(a.earnedAt)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>
            No achievements yet. Log your first climb!
          </Text>
        )}

        {/* Actions */}
        <View style={styles.signOutWrap}>
          <StoneButton
            label="Edit Avatar"
            onPress={() => router.push("/avatar")}
            style={{ alignSelf: "stretch" }}
          />
          <StoneButton label="Sign Out" onPress={() => signOut()} style={{ alignSelf: "stretch" }} />
        </View>
      </ScrollView>

      {/* Achievement toast (shown above scroll view) */}
      {currentToast && (
        <AchievementToast
          title={currentToast.title}
          description={currentToast.description}
          visible={toastVisible}
          onDismiss={dismissToast}
        />
      )}
    </>
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
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  // ─── Header ────────────────────
  header: {
    marginBottom: 12,
  },
  name: {
    fontFamily: "VT323",
    fontSize: 28,
    color: COLORS.text,
    marginBottom: 8,
  },
  portraitRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  barSocket: {
    flex: 1,
    marginLeft: -6,
    gap: 2,
  },
  levelText: {
    fontFamily: "VT323",
    fontSize: 18,
    color: COLORS.primary,
    marginLeft: 12,
  },

  // ─── Buff ──────────────────────
  buffBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: COLORS.xp + "25",
    borderWidth: 1,
    borderColor: COLORS.xp + "60",
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 4,
  },
  buffText: {
    fontFamily: "VT323",
    fontSize: 16,
    color: COLORS.xp,
  },

  // ─── Stats Grid ────────────────
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statCell: {
    alignItems: "center",
    flex: 1,
  },
  statSlot: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  slotBg: {
    position: "absolute",
    width: 54,
    height: 54,
  },
  slotIcon: {},
  statValue: {
    fontFamily: "VT323",
    fontSize: 22,
    color: "#fff",
  },
  statLabel: {
    fontFamily: "VT323",
    fontSize: 12,
    color: COLORS.text,
    textTransform: "uppercase",
    textAlign: "center",
  },

  // ─── Send List ─────────────────
  sendList: {
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  sendRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  sendRowBorder: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  gradeChip: {
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 10,
    minWidth: 52,
    alignItems: "center",
  },
  gradeText: {
    fontFamily: "VT323",
    fontSize: 18,
    color: COLORS.bg,
  },
  sendInfo: {
    flex: 1,
    marginRight: 8,
  },
  sendGym: {
    fontFamily: "VT323",
    fontSize: 15,
    color: "#fff",
  },
  sendMeta: {
    fontFamily: "VT323",
    fontSize: 13,
    color: COLORS.text,
    textTransform: "uppercase",
  },
  sendRight: {
    alignItems: "flex-end",
  },
  sendXp: {
    fontFamily: "VT323",
    fontSize: 16,
    color: "#7cdb8a",
  },
  sendDate: {
    fontFamily: "VT323",
    fontSize: 12,
    color: COLORS.muted,
  },

  // ─── Inventory ─────────────────
  inventoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 8,
  },
  inventoryItem: {
    alignItems: "center",
    width: 64,
  },
  inventorySlot: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  countBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: "center",
  },
  countText: {
    fontFamily: "VT323",
    fontSize: 12,
    color: COLORS.bg,
  },
  itemLabel: {
    fontFamily: "VT323",
    fontSize: 12,
    color: COLORS.text,
    textAlign: "center",
  },

  // ─── Achievements ──────────────
  achievementList: {
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  achievementRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  achievementBorder: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  achievementIcon: {
    width: 32,
    height: 32,
    backgroundColor: COLORS.primary + "20",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontFamily: "VT323",
    fontSize: 17,
    color: COLORS.text,
  },
  achievementDesc: {
    fontFamily: "VT323",
    fontSize: 13,
    color: COLORS.muted,
  },
  achievementDate: {
    fontFamily: "VT323",
    fontSize: 12,
    color: COLORS.muted,
  },

  // ─── Misc ──────────────────────
  emptyText: {
    fontFamily: "VT323",
    fontSize: 16,
    color: COLORS.muted,
    textAlign: "center",
    paddingVertical: 20,
  },
  signOutWrap: {
    marginTop: 32,
    gap: 12,
  },
});
