import { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { t } from "@/lib/copy/en";
import { generateName } from "@/lib/names/generator";

export default function NameScreen() {
  const router = useRouter();
  const [name, setName] = useState(() => generateName());

  const isAvailable = useQuery(api.users.checkNameAvailable, { name });

  const handleReroll = useCallback(() => {
    setName(generateName());
  }, []);

  const handleConfirm = useCallback(() => {
    if (isAvailable) {
      router.push({
        pathname: "/(onboarding)/grades",
        params: { name },
      });
    }
  }, [isAvailable, name, router]);

  return (
    <View style={styles.container}>
      {/* Wizard area — top ~30% */}
      <View style={styles.wizardArea}>
        <View style={styles.wizardAvatar}>
          <Text style={styles.wizardEmoji}>🧙</Text>
        </View>
        <View style={styles.speechBubble}>
          <Text style={styles.speechText}>{t("wizard.welcome")}</Text>
          <View style={styles.speechTail} />
        </View>
      </View>

      {/* Content area */}
      <View style={styles.contentArea}>
        <Text style={styles.nameDisplay}>{name}</Text>

        {isAvailable === undefined ? (
          <ActivityIndicator color="#f4a261" style={styles.loader} />
        ) : isAvailable === false ? (
          <Text style={styles.takenText}>Name taken — reroll!</Text>
        ) : (
          <Text style={styles.availableText}>Name available</Text>
        )}

        <View style={styles.buttonRow}>
          <Pressable style={styles.rerollButton} onPress={handleReroll}>
            <Text style={styles.rerollButtonText}>{t("wizard.reroll")}</Text>
          </Pressable>

          <Pressable
            style={[
              styles.confirmButton,
              (!isAvailable) && styles.buttonDisabled,
            ]}
            onPress={handleConfirm}
            disabled={!isAvailable}
          >
            <Text style={styles.confirmButtonText}>
              {t("wizard.accept_name")}
            </Text>
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
    flex: 0.3,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  wizardAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#16213e",
    borderWidth: 2,
    borderColor: "#2a2a4a",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  wizardEmoji: {
    fontSize: 40,
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
    flex: 0.7,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  nameDisplay: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#f4a261",
    marginBottom: 12,
    textAlign: "center",
  },
  loader: {
    marginBottom: 32,
  },
  takenText: {
    color: "#e76f51",
    fontSize: 14,
    marginBottom: 32,
  },
  availableText: {
    color: "#666680",
    fontSize: 14,
    marginBottom: 32,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 16,
  },
  rerollButton: {
    backgroundColor: "#16213e",
    borderWidth: 2,
    borderColor: "#f4a261",
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 12,
  },
  rerollButtonText: {
    color: "#f4a261",
    fontWeight: "bold",
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: "#f4a261",
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 12,
  },
  confirmButtonText: {
    color: "#1a1a2e",
    fontWeight: "bold",
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
});
