import { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { t } from "@/lib/copy/en";
import { generateName } from "@/lib/names/generator";
import { COLORS } from "@/lib/theme";
import { ParchmentPanel } from "@/components/ParchmentPanel";
import { StoneButton } from "@/components/StoneButton";
import { Avatar } from "@/components/Avatar";

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
        pathname: "/(onboarding)/avatar",
        params: { name },
      });
    }
  }, [isAvailable, name, router]);

  return (
    <View style={styles.container}>
      {/* Wizard area */}
      <View style={styles.wizardArea}>
        <Avatar seed="wizard" size={78} />
        <ParchmentPanel style={styles.speechBubble}>
          <View style={styles.speechTail} />
          <Text style={styles.speechText}>{t("wizard.welcome")}</Text>
        </ParchmentPanel>
      </View>

      {/* Content area */}
      <View style={styles.contentArea}>
        <Text style={styles.nameDisplay}>{name}</Text>

        {isAvailable === undefined ? (
          <ActivityIndicator color={COLORS.primary} style={styles.loader} />
        ) : isAvailable === false ? (
          <Text style={styles.takenText}>Name taken — reroll!</Text>
        ) : (
          <Text style={styles.availableText}>Name available ✓</Text>
        )}

        <View style={styles.buttonRow}>
          <View style={{ opacity: isAvailable ? 1 : 0.4 }}>
            <StoneButton
              label={t("wizard.accept_name")}
              onPress={handleConfirm}
            />
          </View>
          <StoneButton label={t("wizard.reroll")} onPress={handleReroll} />
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
    flex: 0.35,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
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
    flex: 0.65,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  nameDisplay: {
    fontFamily: "VT323",
    fontSize: 40,
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: 4,
  },
  loader: {
    marginBottom: 16,
  },
  takenText: {
    fontFamily: "VT323",
    color: COLORS.danger,
    fontSize: 18,
    marginBottom: 16,
  },
  availableText: {
    fontFamily: "VT323",
    color: COLORS.success,
    fontSize: 18,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
});
