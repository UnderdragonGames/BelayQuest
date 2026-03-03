import { Stack } from "expo-router";
import { AuthGate } from "../../components/AuthGate";

export default function AuthenticatedLayout() {
  return (
    <AuthGate>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="(onboarding)"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="session/[id]"
          options={{ presentation: "card", headerShown: false }}
        />
        <Stack.Screen
          name="create/raid"
          options={{ presentation: "modal", title: "Start a Raid" }}
        />
        <Stack.Screen
          name="create/quest"
          options={{ presentation: "modal", title: "Post to Quest Board" }}
        />
      </Stack>
    </AuthGate>
  );
}
