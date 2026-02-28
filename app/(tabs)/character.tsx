import { StyleSheet, Text, View } from "react-native";
import { t } from "@/lib/copy/en";

export default function CharacterScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.placeholder}>
        <Text style={styles.title}>{t("character.title")}</Text>
        <Text style={styles.subtitle}>Level 1</Text>
        <Text style={styles.xp}>0 XP</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#eaeaea",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#f4a261",
    marginBottom: 4,
  },
  xp: {
    fontSize: 14,
    color: "#666680",
  },
});
