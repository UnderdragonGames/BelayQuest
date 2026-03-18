import { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { t } from "@/lib/copy/en";
import type { Id } from "@/convex/_generated/dataModel";
import { COLORS } from "@/lib/theme";
import { ParchmentPanel } from "@/components/ParchmentPanel";
import { StoneButton } from "@/components/StoneButton";
import { AddPeopleModal } from "@/components/AddPeopleModal";
import { Avatar } from "@/components/Avatar";

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

  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([]);
  const [showAddPeople, setShowAddPeople] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        <Avatar seed="wizard" size={78} />
        <ParchmentPanel style={styles.speechBubble}>
          <View style={styles.speechTail} />
          <Text style={styles.speechText}>{t("wizard.invite")}</Text>
        </ParchmentPanel>
      </View>

      {/* Content area */}
      <View style={styles.contentArea}>
        {/* Add people button */}
        <StoneButton
          label="Add Friends"
          onPress={() => setShowAddPeople(true)}
          style={{ alignSelf: "stretch", marginBottom: 16 }}
        />

        {/* Phone number list */}
        {phoneNumbers.length === 0 ? (
          <Text style={styles.emptyText}>
            No friends added yet. You can always invite them later!
          </Text>
        ) : (
          phoneNumbers.map((item) => (
            <View key={item} style={styles.phoneRow}>
              <Text style={styles.phoneText}>{item}</Text>
              <Pressable
                style={styles.removeButton}
                onPress={() => removePhone(item)}
              >
                <Text style={styles.removeButtonText}>×</Text>
              </Pressable>
            </View>
          ))
        )}

        {/* Action buttons */}
        <View style={styles.buttonColumn}>
          <View style={{ opacity: isSubmitting ? 0.4 : 1 }}>
            <StoneButton
              label={t("wizard.start")}
              onPress={handleFinish}
              style={{ alignSelf: "stretch" }}
            />
          </View>

          <View style={{ opacity: isSubmitting ? 0.4 : 1 }}>
            <StoneButton
              label={t("wizard.skip")}
              onPress={handleFinish}
              style={{ alignSelf: "stretch" }}
            />
          </View>
        </View>
      </View>

      <AddPeopleModal
        visible={showAddPeople}
        onClose={() => setShowAddPeople(false)}
        mode="batch"
        onAdd={(entries) => {
          const newPhones = entries.map((e) => e.phone);
          setPhoneNumbers((prev) => {
            const existing = new Set(prev);
            return [...prev, ...newPhones.filter((p) => !existing.has(p))];
          });
          setShowAddPeople(false);
        }}
      />
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
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  phoneText: {
    flex: 1,
    fontFamily: "VT323",
    color: COLORS.text,
    fontSize: 18,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    fontFamily: "VT323",
    color: COLORS.text,
    fontSize: 20,
  },
  emptyText: {
    fontFamily: "VT323",
    color: COLORS.muted,
    fontSize: 16,
    textAlign: "center",
    marginTop: 24,
    lineHeight: 22,
  },
  // ─── Buttons ──────────────────────────────────────────
  buttonColumn: {
    gap: 12,
    marginBottom: 32,
    marginTop: 12,
  },
});
