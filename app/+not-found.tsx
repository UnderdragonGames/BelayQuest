import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Lost in the mountains" }} />
      <View style={styles.container}>
        <Text style={styles.title}>This path leads nowhere.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Return to camp</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#1a1a2e",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#eaeaea",
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: "#f4a261",
  },
});
