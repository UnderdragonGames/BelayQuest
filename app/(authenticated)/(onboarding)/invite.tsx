import { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  FlatList,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { t } from "@/lib/copy/en";
import type { Id } from "@/convex/_generated/dataModel";

export default function InviteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    name: string;
    climbingStyles: string;
    gradeRangeRoute: string;
    gradeRangeBoulder: string;
    yearsClimbing: string;
    favoriteGyms: string;
  }>();

  const completeOnboarding = useMutation(api.users.completeOnboarding);

  const [phoneInput, setPhoneInput] = useState("");
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addPhone = useCallback(() => {
    const cleaned = phoneInput.trim().replace(/[^0-9+]/g, "");
    if (cleaned.length < 7) {
      return;
    }
    if (phoneNumbers.includes(cleaned)) {
      return;
    }
    setPhoneNumbers((prev) => [...prev, cleaned]);
    setPhoneInput("");
  }, [phoneInput, phoneNumbers]);

  const removePhone = useCallback((phone: string) => {
    setPhoneNumbers((prev) => prev.filter((p) => p !== phone));
  }, []);

  const handleFinish = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const climbingStyles: string[] = JSON.parse(params.climbingStyles);
      const gradeRangeRoute = JSON.parse(params.gradeRangeRoute);
      const gradeRangeBoulder = JSON.parse(params.gradeRangeBoulder);
      const favoriteGyms: Id<"gyms">[] = JSON.parse(params.favoriteGyms);

      await completeOnboarding({
        generatedName: params.name,
        climbingStyles,
        gradeRangeRoute,
        gradeRangeBoulder,
        yearsClimbing: params.yearsClimbing,
        favoriteGyms,
        invitePhones: phoneNumbers,
      });

      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [params, phoneNumbers, completeOnboarding, router]);

  return (
    <View style={styles.container}>
      {/* Wizard area */}
      <View style={styles.wizardArea}>
        <View style={styles.wizardAvatar}>
          <Text style={styles.wizardEmoji}>🧙</Text>
        </View>
        <View style={styles.speechBubble}>
          <Text style={styles.speechText}>{t("wizard.invite")}</Text>
          <View style={styles.speechTail} />
        </View>
      </View>

      {/* Content area */}
      <View style={styles.contentArea}>
        {/* Phone input row */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.phoneInput}
            placeholder="Phone number"
            placeholderTextColor="#666680"
            value={phoneInput}
            onChangeText={setPhoneInput}
            keyboardType="phone-pad"
            autoComplete="tel"
            returnKeyType="done"
            onSubmitEditing={addPhone}
          />
          <Pressable style={styles.addButton} onPress={addPhone}>
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>

        {/* Phone number list */}
        <FlatList
          data={phoneNumbers}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <View style={styles.phoneRow}>
              <Text style={styles.phoneText}>{item}</Text>
              <Pressable
                style={styles.removeButton}
                onPress={() => removePhone(item)}
              >
                <Text style={styles.removeButtonText}>x</Text>
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No friends added yet. You can always invite them later!
            </Text>
          }
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Action buttons */}
        <View style={styles.buttonColumn}>
          <Pressable
            style={[
              styles.startButton,
              isSubmitting && styles.buttonDisabled,
            ]}
            onPress={handleFinish}
            disabled={isSubmitting}
          >
            <Text style={styles.startButtonText}>{t("wizard.start")}</Text>
          </Pressable>

          <Pressable
            style={[styles.skipButton, isSubmitting && styles.buttonDisabled]}
            onPress={handleFinish}
            disabled={isSubmitting}
          >
            <Text style={styles.skipButtonText}>{t("wizard.skip")}</Text>
          </Pressable>
        </View>
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
  inputRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: "#16213e",
    borderWidth: 1,
    borderColor: "#2a2a4a",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#eaeaea",
    fontSize: 16,
  },
  addButton: {
    backgroundColor: "#f4a261",
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "#1a1a2e",
    fontWeight: "bold",
    fontSize: 16,
  },
  // ─── Phone List ───────────────────────────────────────
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 8,
  },
  phoneRow: {
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
  phoneText: {
    flex: 1,
    color: "#eaeaea",
    fontSize: 15,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2a2a4a",
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    color: "#eaeaea",
    fontWeight: "bold",
    fontSize: 14,
  },
  emptyText: {
    color: "#666680",
    fontSize: 14,
    textAlign: "center",
    marginTop: 24,
    lineHeight: 20,
  },
  // ─── Buttons ──────────────────────────────────────────
  buttonColumn: {
    gap: 12,
    marginBottom: 32,
    marginTop: 12,
  },
  startButton: {
    backgroundColor: "#f4a261",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
  },
  startButtonText: {
    color: "#1a1a2e",
    fontWeight: "bold",
    fontSize: 18,
  },
  skipButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#2a2a4a",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  skipButtonText: {
    color: "#666680",
    fontWeight: "600",
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
});
