import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#1a1a2e" },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="name" />
      <Stack.Screen name="grades" />
      <Stack.Screen name="gyms" />
      <Stack.Screen name="invite" />
    </Stack>
  );
}
