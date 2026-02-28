import { StyleSheet, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { t } from "@/lib/copy/en";

export default function QuestsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("app.name")}</Text>
        <Pressable
          style={styles.createButton}
          onPress={() => router.push("/create/raid")}
        >
          <Text style={styles.createButtonText}>+</Text>
        </Pressable>
      </View>

      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>{t("empty.quests")}</Text>
        <Text style={styles.emptySubtext}>{t("empty.quests.cta")}</Text>
        <Pressable
          style={styles.ctaButton}
          onPress={() => router.push("/create/raid")}
        >
          <Text style={styles.ctaButtonText}>{t("action.create_raid")}</Text>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#eaeaea",
  },
  createButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f4a261",
    justifyContent: "center",
    alignItems: "center",
  },
  createButtonText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1a1a2e",
    marginTop: -2,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    color: "#eaeaea",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666680",
    marginBottom: 24,
  },
  ctaButton: {
    backgroundColor: "#f4a261",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  ctaButtonText: {
    color: "#1a1a2e",
    fontWeight: "bold",
    fontSize: 16,
  },
});
