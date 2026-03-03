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
        <View style={styles.wizardAvatar}>
          <Text style={styles.wizardEmoji}>🧙</Text>
        </View>
        <View style={styles.speechBubble}>
          <Text style={styles.speechText}>{t("wizard.gyms")}</Text>
          <View style={styles.speechTail} />
        </View>
      </View>

      {/* Content area */}
      <View style={styles.contentArea}>
        {/* Search input */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search gyms..."
          placeholderTextColor="#666680"
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
                  <Text style={styles.selectedChipX}> x</Text>
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
        <Pressable
          style={[styles.continueButton, !canContinue && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!canContinue}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  // ─── Wizard Area ──────────────────────────────────────
  wizardArea: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  wizardAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#16213e",
    borderWidth: 2,
    borderColor: "#2a2a4a",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  wizardEmoji: {
    fontSize: 32,
  },
  speechBubble: {
    backgroundColor: "#16213e",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2a2a4a",
    paddingHorizontal: 20,
    paddingVertical: 14,
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
    borderBottomColor: "#2a2a4a",
  },
  speechText: {
    color: "#eaeaea",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  // ─── Content Area ─────────────────────────────────────
  contentArea: {
    flex: 1,
    paddingHorizontal: 24,
  },
  searchInput: {
    backgroundColor: "#16213e",
    borderWidth: 1,
    borderColor: "#2a2a4a",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#eaeaea",
    fontSize: 16,
    marginBottom: 12,
  },
  selectedSection: {
    marginBottom: 12,
  },
  selectedLabel: {
    color: "#666680",
    fontSize: 13,
    marginBottom: 8,
  },
  selectedChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectedChip: {
    flexDirection: "row",
    backgroundColor: "#f4a261",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectedChipText: {
    color: "#1a1a2e",
    fontWeight: "600",
    fontSize: 13,
  },
  selectedChipX: {
    color: "#1a1a2e",
    fontWeight: "bold",
    fontSize: 13,
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
    backgroundColor: "#16213e",
    borderWidth: 1,
    borderColor: "#2a2a4a",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
  },
  gymRowSelected: {
    borderColor: "#f4a261",
  },
  gymInfo: {
    flex: 1,
  },
  gymName: {
    color: "#eaeaea",
    fontSize: 15,
    fontWeight: "600",
  },
  gymLocation: {
    color: "#666680",
    fontSize: 13,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#2a2a4a",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  checkboxChecked: {
    backgroundColor: "#f4a261",
    borderColor: "#f4a261",
  },
  checkmark: {
    color: "#1a1a2e",
    fontWeight: "bold",
    fontSize: 14,
  },
  emptyText: {
    color: "#666680",
    fontSize: 14,
    textAlign: "center",
    marginTop: 24,
  },
  // ─── Buttons ──────────────────────────────────────────
  continueButton: {
    backgroundColor: "#f4a261",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 32,
  },
  continueButtonText: {
    color: "#1a1a2e",
    fontWeight: "bold",
    fontSize: 18,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
});
