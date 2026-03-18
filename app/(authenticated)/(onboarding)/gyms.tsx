import { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  FlatList,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { t } from "@/lib/copy/en";
import type { Id } from "@/convex/_generated/dataModel";
import { COLORS } from "@/lib/theme";
import { ParchmentPanel } from "@/components/ParchmentPanel";
import { StoneButton } from "@/components/StoneButton";
import { Avatar } from "@/components/Avatar";

export default function GymsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    name: string;
    climbingStyles: string;
    gradeRangeRoute: string;
    gradeRangeBoulder: string;
    yearsClimbing: string;
  }>();

  const [searchText, setSearchText] = useState("");
  const [selectedGyms, setSelectedGyms] = useState<
    Map<Id<"gyms">, { id: Id<"gyms">; name: string }>
  >(new Map());

  const searchResults = useQuery(
    api.gyms.search,
    searchText.trim().length > 0 ? { query: searchText.trim() } : "skip"
  );

  const toggleGym = useCallback(
    (gym: { _id: Id<"gyms">; name: string }) => {
      setSelectedGyms((prev) => {
        const next = new Map(prev);
        if (next.has(gym._id)) {
          next.delete(gym._id);
        } else {
          next.set(gym._id, { id: gym._id, name: gym.name });
        }
        return next;
      });
    },
    []
  );

  const canContinue = selectedGyms.size >= 1;

  const handleContinue = useCallback(() => {
    router.push({
      pathname: "/(onboarding)/invite",
      params: {
        ...params,
        favoriteGyms: JSON.stringify([...selectedGyms.keys()]),
      },
    });
  }, [router, params, selectedGyms]);

  return (
    <View style={styles.container}>
      {/* Wizard area */}
      <View style={styles.wizardArea}>
        <Avatar seed="wizard" size={78} />
        <ParchmentPanel style={styles.speechBubble}>
          <View style={styles.speechTail} />
          <Text style={styles.speechText}>{t("wizard.gyms")}</Text>
        </ParchmentPanel>
      </View>

      {/* Content area */}
      <View style={styles.contentArea}>
        {/* Search input */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search gyms..."
          placeholderTextColor={COLORS.muted}
          value={searchText}
          onChangeText={setSearchText}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Selected gyms */}
        {selectedGyms.size > 0 && (
          <View style={styles.selectedSection}>
            <Text style={styles.selectedLabel}>
              Selected ({selectedGyms.size})
            </Text>
            <View style={styles.selectedChips}>
              {[...selectedGyms.values()].map((gym) => (
                <Pressable
                  key={gym.id}
                  style={styles.selectedChip}
                  onPress={() =>
                    toggleGym({ _id: gym.id, name: gym.name })
                  }
                >
                  <Text style={styles.selectedChipText}>{gym.name}</Text>
                  <Text style={styles.selectedChipX}> ×</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Search results */}
        <FlatList
          data={searchResults ?? []}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => {
            const isSelected = selectedGyms.has(item._id);
            return (
              <Pressable
                style={[styles.gymRow, isSelected && styles.gymRowSelected]}
                onPress={() => toggleGym(item)}
              >
                <View style={styles.gymInfo}>
                  <Text style={styles.gymName}>{item.name}</Text>
                  <Text style={styles.gymLocation}>
                    {item.city}, {item.state}
                  </Text>
                </View>
                <View
                  style={[
                    styles.checkbox,
                    isSelected && styles.checkboxChecked,
                  ]}
                >
                  {isSelected && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            searchText.trim().length > 0 ? (
              <Text style={styles.emptyText}>No gyms found</Text>
            ) : (
              <Text style={styles.emptyText}>
                Start typing to search for gyms
              </Text>
            )
          }
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Continue button */}
        <View style={{ opacity: canContinue ? 1 : 0.4, marginTop: 12, marginBottom: 32 }}>
          <StoneButton label="Continue" onPress={handleContinue} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  // ─── Wizard Area ──────────────────────────────────────
  wizardArea: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 24,
    gap: 12,
  },
  speechBubble: {
    maxWidth: "90%",
    position: "relative",
  },
  speechTail: {
    position: "absolute",
    top: -8,
    alignSelf: "center",
    left: "50%",
    marginLeft: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#5a4230",
  },
  speechText: {
    fontFamily: "VT323",
    color: COLORS.bg,
    fontSize: 18,
    lineHeight: 24,
    textAlign: "center",
  },
  // ─── Content Area ─────────────────────────────────────
  contentArea: {
    flex: 1,
    paddingHorizontal: 24,
  },
  searchInput: {
    fontFamily: "VT323",
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 18,
    marginBottom: 12,
  },
  selectedSection: {
    marginBottom: 12,
  },
  selectedLabel: {
    fontFamily: "VT323",
    color: COLORS.primary,
    fontSize: 16,
    marginBottom: 8,
  },
  selectedChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectedChip: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectedChipText: {
    fontFamily: "VT323",
    color: COLORS.bg,
    fontSize: 16,
  },
  selectedChipX: {
    fontFamily: "VT323",
    color: COLORS.bg,
    fontSize: 16,
  },
  // ─── Gym List ─────────────────────────────────────────
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 8,
  },
  gymRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  gymRowSelected: {
    borderColor: COLORS.primary,
  },
  gymInfo: {
    flex: 1,
  },
  gymName: {
    fontFamily: "VT323",
    color: COLORS.text,
    fontSize: 18,
  },
  gymLocation: {
    fontFamily: "VT323",
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    fontFamily: "VT323",
    color: COLORS.bg,
    fontSize: 16,
  },
  emptyText: {
    fontFamily: "VT323",
    color: COLORS.muted,
    fontSize: 16,
    textAlign: "center",
    marginTop: 24,
  },
});
