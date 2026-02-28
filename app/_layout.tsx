import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

const convex = new ConvexReactClient(
  process.env.EXPO_PUBLIC_CONVEX_URL!,
  { unsavedChangesWarning: false }
);

SplashScreen.preventAutoHideAsync();

// Belay Quest dark theme — pixel art RPG vibes
const belayQuestTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: "#f4a261", // Warm amber — primary actions
    background: "#1a1a2e", // Deep navy — main background
    card: "#16213e", // Slightly lighter — cards/surfaces
    text: "#eaeaea", // Off-white — primary text
    border: "#2a2a4a", // Subtle border
    notification: "#e76f51", // Warm red — notifications/alerts
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ConvexProvider client={convex}>
      <ThemeProvider value={belayQuestTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
      </ThemeProvider>
    </ConvexProvider>
  );
}
