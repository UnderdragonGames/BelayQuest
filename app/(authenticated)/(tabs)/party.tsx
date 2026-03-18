import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { t } from "@/lib/copy/en";
import { COLORS } from "@/lib/theme";
import { Avatar } from "@/components/Avatar";
import { PixelIcon } from "@/components/PixelIcon";
import { SectionHeader } from "@/components/SectionHeader";
import { StoneButton } from "@/components/StoneButton";
import { AddPeopleModal } from "@/components/AddPeopleModal";
import { generateName } from "@/lib/names/generator";
import type { Id } from "@/convex/_generated/dataModel";

// ─── Types ────────────────────────────────────────────────────────────────────

type Connection = {
  _id: Id<"connections">;
  connectedUserId: Id<"users">;
  nickname?: string;
  generatedName?: string;
  level?: number;
  climbingStyles?: string[];
  maxGradeRoute?: string;
  maxGradeBoulder?: string;
  currentStatus?: { effect: string; type: "buff" | "debuff"; expiresAt: number };
};

type Guild = {
  _id: Id<"guilds">;
  name: string;
  isDefault: boolean;
  members: { userId: Id<"users">; generatedName?: string; level?: number; nickname?: string }[];
};

// ─── Guild Card ───────────────────────────────────────────────────────────────

function GuildCard({ guild, onSetDefault }: { guild: Guild; onSetDefault: () => void }) {
  const memberCount = guild.members.length;
  return (
    <Pressable
      style={[styles.guildCard, guild.isDefault && styles.guildCardDefault]}
      onLongPress={onSetDefault}
    >
      <View style={styles.guildCardTop}>
        {guild.isDefault && (
          <PixelIcon name="star" size={14} style={styles.guildDefaultStar} />
        )}
        <Text style={styles.guildName} numberOfLines={2}>
          {guild.name}
        </Text>
      </View>
      <Text style={styles.guildMemberCount}>
        {memberCount} {memberCount === 1 ? "member" : "members"}
      </Text>
    </Pressable>
  );
}

// ─── New Guild Modal ──────────────────────────────────────────────────────────

function NewGuildModal({
  visible,
  connections,
  onClose,
  onCreate,
}: {
  visible: boolean;
  connections: Connection[];
  onClose: () => void;
  onCreate: (name: string, memberIds: Id<"users">[]) => Promise<void>;
}) {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const [name, setName] = useState(generateName);
  const [selected, setSelected] = useState<Set<Id<"users">>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(generateName());
      setSelected(new Set());
    }
  }, [visible]);

  function toggleMember(userId: Id<"users">) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  async function handleCreate() {
    setSaving(true);
    try {
      await onCreate(name, Array.from(selected));
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>New Guild</Text>
          <Pressable onPress={onClose} style={styles.modalCloseBtn}>
            <Text style={styles.modalCloseText}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.nameRow}>
          <Text style={styles.nameDisplay} numberOfLines={1}>
            {name}
          </Text>
          <StoneButton label="Reroll" onPress={() => setName(generateName())} />
        </View>

        <View style={styles.membersSection}>
          {connections.length > 0 && (
            <>
              <Text style={styles.modalSectionLabel}>Add Members</Text>
              <ScrollView nestedScrollEnabled>
                {connections.map((conn) => {
                  const isSelected = selected.has(conn.connectedUserId);
                  const displayName = conn.nickname ?? conn.generatedName ?? "Adventurer";
                  return (
                    <Pressable
                      key={conn._id}
                      style={[styles.memberSelectRow, isSelected && styles.memberSelectRowActive]}
                      onPress={() => toggleMember(conn.connectedUserId)}
                    >
                      <Avatar seed={conn.connectedUserId} size={36} />
                      <Text style={styles.memberSelectName}>{displayName}</Text>
                      {isSelected && <PixelIcon name="checkmark" size={20} />}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </>
          )}
        </View>

        <View style={[styles.modalActions, { paddingBottom: Math.max(16, bottomInset) }]}>
          <Pressable onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </Pressable>
          {saving ? (
            <ActivityIndicator color={COLORS.primary} style={styles.createBtn} />
          ) : (
            <StoneButton label="Create Guild" onPress={handleCreate} style={styles.createBtn} />
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Connection Row ───────────────────────────────────────────────────────────

function ConnectionRow({ conn }: { conn: Connection }) {
  const displayName = conn.nickname ?? conn.generatedName ?? "Adventurer";
  const grade = conn.maxGradeBoulder ?? conn.maxGradeRoute ?? "—";
  const isDebuff = conn.currentStatus?.type === "debuff";

  return (
    <View style={styles.connectionRow}>
      <Avatar seed={conn.connectedUserId} size={48} />
      <View style={styles.connInfo}>
        <View style={styles.connNameRow}>
          <Text style={styles.connName} numberOfLines={1}>
            {displayName}
          </Text>
          {conn.nickname && conn.generatedName && (
            <Text style={styles.connGeneratedName}>({conn.generatedName})</Text>
          )}
        </View>
        <View style={styles.connMeta}>
          {conn.climbingStyles && conn.climbingStyles.length > 0 && (
            <Text style={styles.connStyle}>{conn.climbingStyles[0]}</Text>
          )}
          <Text style={styles.connGrade}>{grade}</Text>
          {conn.currentStatus && (
            <View style={[styles.statusBadge, isDebuff && styles.statusBadgeDebuff]}>
              <Text style={[styles.statusText, isDebuff && styles.statusTextDebuff]}>
                {conn.currentStatus.effect}
              </Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.connLevel}>
        <PixelIcon name="star" size={14} />
        <Text style={styles.connLevelText}>{conn.level ?? 1}</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PartyScreen() {
  const { top: topInset } = useSafeAreaInsets();
  const connections = useQuery(api.connections.myConnections);
  const guilds = useQuery(api.connections.myGuilds);
  const createGuild = useMutation(api.guilds.create);
  const setDefaultGuild = useMutation(api.guilds.setDefault);
  const addByPhone = useMutation(api.connections.addByPhone);

  const [showNewGuild, setShowNewGuild] = useState(false);
  const [showAddPeople, setShowAddPeople] = useState(false);

  const isLoading = connections === undefined || guilds === undefined;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.contentContainer, { paddingTop: topInset + 16 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Guilds section */}
        <SectionHeader title={t("party.guilds")} />

        {isLoading ? (
          <ActivityIndicator color={COLORS.primary} style={styles.loader} />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.guildScrollContent}
            style={styles.guildScroll}
          >
            {(guilds ?? []).map((guild) => (
              <GuildCard
                key={guild._id}
                guild={guild}
                onSetDefault={() => setDefaultGuild({ guildId: guild._id })}
              />
            ))}
            <Pressable
              style={styles.newGuildCard}
              onPress={() => setShowNewGuild(true)}
            >
              <PixelIcon name="plus" size={28} />
              <Text style={styles.newGuildLabel}>{t("party.new_guild")}</Text>
            </Pressable>
          </ScrollView>
        )}

        {/* Connections section */}
        <SectionHeader title={t("party.connections")} />

        {isLoading ? (
          <ActivityIndicator color={COLORS.primary} style={styles.loader} />
        ) : (connections ?? []).length === 0 ? (
          <View style={styles.emptyConnections}>
            <PixelIcon name="handshake" size={48} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>{t("empty.connections")}</Text>
            <Text style={styles.emptySubtext}>{t("empty.connections.cta")}</Text>
          </View>
        ) : (
          <View style={styles.connectionList}>
            {(connections ?? []).map((conn, i) => (
              <View key={conn._id} style={i > 0 ? styles.connRowBorder : undefined}>
                <ConnectionRow conn={conn} />
              </View>
            ))}
          </View>
        )}

        {/* Add by Phone */}
        <View style={styles.addPhoneSection}>
          <StoneButton
            label={t("party.add_phone")}
            onPress={() => setShowAddPeople(true)}
            style={{ alignSelf: "stretch", marginHorizontal: 16 }}
          />
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>

      <NewGuildModal
        visible={showNewGuild}
        connections={connections ?? []}
        onClose={() => setShowNewGuild(false)}
        onCreate={async (name, memberIds) => {
          await createGuild({ name, memberIds });
        }}
      />

      <AddPeopleModal
        visible={showAddPeople}
        onClose={() => setShowAddPeople(false)}
        mode="single"
        onAdd={async (entries) => {
          for (const entry of entries) {
            try {
              const result = await addByPhone({ phone: entry.phone, nickname: entry.name });
              if (result.found) {
                Alert.alert("Ally found!", "They've been added to your connections.");
              } else {
                Alert.alert("Invite pending", "They'll be added when they join BelayQuest.");
              }
            } catch {
              Alert.alert("Error", "Could not add connection. Check the number and try again.");
            }
          }
        }}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  loader: {
    marginVertical: 20,
  },

  // ─── Guilds ──────────────────────────────────
  guildScroll: {
    marginBottom: 4,
  },
  guildScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    gap: 10,
  },
  guildCard: {
    width: 120,
    minHeight: 80,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 10,
    justifyContent: "space-between",
  },
  guildCardDefault: {
    borderColor: COLORS.primary,
  },
  guildCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
  },
  guildDefaultStar: {
    marginTop: 3,
  },
  guildName: {
    fontFamily: "VT323",
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
  guildMemberCount: {
    fontFamily: "VT323",
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 6,
  },
  newGuildCard: {
    width: 100,
    minHeight: 80,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 10,
    opacity: 0.7,
  },
  newGuildLabel: {
    fontFamily: "VT323",
    fontSize: 14,
    color: COLORS.primary,
    textAlign: "center",
  },

  // ─── Connections ──────────────────────────────
  emptyConnections: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyIcon: {
    opacity: 0.5,
  },
  emptyText: {
    fontFamily: "VT323",
    fontSize: 20,
    color: COLORS.text,
    textAlign: "center",
  },
  emptySubtext: {
    fontFamily: "VT323",
    fontSize: 16,
    color: COLORS.muted,
    textAlign: "center",
  },
  connectionList: {
    marginHorizontal: 16,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
  },
  connRowBorder: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  connectionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  connInfo: {
    flex: 1,
    minWidth: 0,
  },
  connNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  connName: {
    fontFamily: "VT323",
    fontSize: 18,
    color: COLORS.text,
  },
  connGeneratedName: {
    fontFamily: "VT323",
    fontSize: 14,
    color: COLORS.muted,
  },
  connMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
    flexWrap: "wrap",
  },
  connStyle: {
    fontFamily: "VT323",
    fontSize: 13,
    color: COLORS.muted,
    textTransform: "capitalize",
  },
  connGrade: {
    fontFamily: "VT323",
    fontSize: 14,
    color: COLORS.primary,
  },
  statusBadge: {
    backgroundColor: COLORS.xp + "30",
    borderWidth: 1,
    borderColor: COLORS.xp + "60",
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  statusBadgeDebuff: {
    backgroundColor: "#c4444420",
    borderColor: "#c4444460",
  },
  statusText: {
    fontFamily: "VT323",
    fontSize: 12,
    color: COLORS.xp,
  },
  statusTextDebuff: {
    color: COLORS.danger,
  },
  connLevel: {
    alignItems: "center",
    gap: 2,
  },
  connLevelText: {
    fontFamily: "VT323",
    fontSize: 16,
    color: COLORS.primary,
  },

  // ─── Add Phone ────────────────────────────────
  addPhoneSection: {
    marginTop: 8,
  },

  // ─── New Guild Modal ───────────────────────────
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontFamily: "VT323",
    fontSize: 28,
    color: COLORS.primary,
    letterSpacing: 2,
  },
  modalCloseBtn: {
    padding: 8,
  },
  modalCloseText: {
    fontFamily: "VT323",
    fontSize: 22,
    color: COLORS.muted,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  nameDisplay: {
    flex: 1,
    fontFamily: "VT323",
    fontSize: 24,
    color: COLORS.text,
  },
  membersSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  modalSectionLabel: {
    fontFamily: "VT323",
    fontSize: 15,
    color: COLORS.muted,
    marginTop: 12,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  memberSelectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
  modalActions: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cancelBtnText: {
    fontFamily: "VT323",
    fontSize: 18,
    color: COLORS.muted,
  },
  createBtn: {
    flex: 1,
  },

  bottomPad: {
    height: 40,
  },
});
