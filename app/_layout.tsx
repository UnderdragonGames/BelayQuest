import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Platform } from "react-native";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(authenticated)",
};

const convex = new ConvexReactClient(
  process.env.EXPO_PUBLIC_CONVEX_URL!,
  { unsavedChangesWarning: false }
);

// Platform-aware token storage: SecureStore on native, localStorage on web
const storage =
  Platform.OS === "web"
    ? {
        getItem: (key: string) => {
          const value = localStorage.getItem(key);
          return Promise.resolve(value);
        },
        setItem: (key: string, value: string) => {
          localStorage.setItem(key, value);
          return Promise.resolve();
        },
        removeItem: (key: string) => {
          localStorage.removeItem(key);
          return Promise.resolve();
        },
      }
    : (() => {
        const SecureStore = require("expo-secure-store");
        return {
          getItem: (key: string) => SecureStore.getItemAsync(key),
          setItem: (key: string, value: string) =>
            SecureStore.setItemAsync(key, value),
          removeItem: (key: string) => SecureStore.deleteItemAsync(key),
        };
      })();

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
    <ConvexAuthProvider client={convex} storage={storage}>
      <ThemeProvider value={belayQuestTheme}>
        <Stack>
          <Stack.Screen
            name="(authenticated)"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="(public)" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </ConvexAuthProvider>
  );
}
