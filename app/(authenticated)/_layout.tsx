import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AuthGate } from "../../components/AuthGate";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

function GuardedStack() {
  const user = useQuery(api.users.me);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (user === undefined) return;
    const inOnboarding = segments[1] === "(onboarding)";
    if (!user?.onboardingComplete && !inOnboarding) {
      router.replace("/(onboarding)/name");
    }
  }, [user, segments, router]);

  const inOnboarding = segments[1] === "(onboarding)";
  const needsRedirect =
    user !== undefined && !user?.onboardingComplete && !inOnboarding;

  // Show spinner while loading user data or while redirect is pending
  if (user === undefined || needsRedirect) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
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
        name="session/summary"
        options={{ presentation: "card", headerShown: false }}
      />
      <Stack.Screen
        name="avatar"
        options={{ title: "Edit Avatar", headerBackTitle: "Back" }}
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
  );
}

export default function AuthenticatedLayout() {
  return (
    <AuthGate>
      <GuardedStack />
    </AuthGate>
  );
}
