import { StyleSheet, Text, View } from "react-native";
import { t } from "@/lib/copy/en";

export default function PartyScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>{t("empty.connections")}</Text>
        <Text style={styles.emptySubtext}>{t("empty.connections.cta")}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
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
    textAlign: "center",
  },
});
