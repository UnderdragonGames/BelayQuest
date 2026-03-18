import { Stack } from "expo-router";
import { COLORS } from "@/lib/theme";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.bg },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="name" />
      <Stack.Screen name="avatar" />
      <Stack.Screen name="grades" />
      <Stack.Screen name="gyms" />
      <Stack.Screen name="invite" />
    </Stack>
  );
}
