import { StyleSheet, Text, View } from "react-native";

export default function CreateQuestScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Post to Quest Board</Text>
      <Text style={styles.subtitle}>Gym → Time → Capacity → Grade</Text>
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
