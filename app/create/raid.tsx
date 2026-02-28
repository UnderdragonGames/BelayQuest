import { StyleSheet, Text, View } from "react-native";

export default function CreateRaidScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Start a Raid</Text>
      <Text style={styles.subtitle}>Gym → Time → Invite</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
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
    fontSize: 14,
    color: "#666680",
  },
});
