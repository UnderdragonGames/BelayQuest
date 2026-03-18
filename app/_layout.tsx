import * as Sentry from "@sentry/react-native";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Platform } from "react-native";
import { AnimatedSplash } from "@/components/AnimatedSplash";
import * as Linking from "expo-linking";
import { ConvexReactClient, useConvexAuth, useQuery } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";

// Initialize Sentry before anything else renders.
// DSN is a public key — safe to embed in the client bundle.
// In dev/CI, skip if the DSN is the placeholder string.
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
if (SENTRY_DSN && SENTRY_DSN !== "SENTRY_DSN_PLACEHOLDER") {
  Sentry.init({
    dsn: SENTRY_DSN,
    // Send 100% of errors; sample transactions at 20% to stay in free tier
    tracesSampleRate: 0.2,
    // Enable native crash reporting on iOS/Android
    enableNativeCrashHandling: true,
    // Tag every event with the release so source maps resolve correctly
    release: process.env.EXPO_PUBLIC_APP_VERSION,
    // Disable in Expo Go / dev builds to avoid noise
    enabled: !__DEV__,
  });
}

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(authenticated)",
};

const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL;
if (!CONVEX_URL) {
  throw new Error(
    `EXPO_PUBLIC_CONVEX_URL is not set. ` +
    `Ensure it is defined in eas.json env or .env.local. ` +
    `Got: ${JSON.stringify(CONVEX_URL)}`
  );
}
const convex = new ConvexReactClient(CONVEX_URL, { unsavedChangesWarning: false });

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
    primary: "#d4a44a", // Warm gold — primary actions
    background: "#2a1f14", // Dark brown — main background
    card: "#3b2a1a", // Slightly lighter — cards/surfaces
    text: "#f5e6c8", // Parchment — primary text
    border: "#5a4230", // Warm brown border
    notification: "#c44", // Red — notifications/alerts
  },
};

// ─── Deep Link Handler ─────────────────────────────────────────
// Extracts shortCode from /j/{shortCode} URLs, resolves to a session ID
// via Convex, and navigates once the user is authenticated.
function extractShortCode(url: string): string | null {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/^\/j\/([^/]+)/);
    return match ? match[1] : null;
  } catch {
    // Handle scheme-based URLs: belayquest://j/{shortCode}
    const match = url.match(/\/j\/([^/?#]+)/);
    return match ? match[1] : null;
  }
}

function DeepLinkHandler({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const [pendingShortCode, setPendingShortCode] = useState<string | null>(null);
  const handledRef = useRef(false);

  // Resolve shortCode → session ID
  const resolvedSessionId = useQuery(
    api.sessions.getSessionIdByShortCode,
    pendingShortCode ? { shortCode: pendingShortCode } : "skip"
  );

  // Listen for deep link URLs (cold start + warm open)
  useEffect(() => {
    // Cold start: check initial URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        const code = extractShortCode(url);
        if (code) setPendingShortCode(code);
      }
    });

    // Warm open: listen for incoming URLs
    const subscription = Linking.addEventListener("url", ({ url }) => {
      const code = extractShortCode(url);
      if (code) {
        handledRef.current = false;
        setPendingShortCode(code);
      }
    });

    return () => subscription.remove();
  }, []);

  // Navigate once authenticated and session ID is resolved
  useEffect(() => {
    if (!isAuthenticated || !resolvedSessionId || handledRef.current) return;

    handledRef.current = true;
    setPendingShortCode(null);
    router.replace({
      pathname: "/session/[id]",
      params: { id: resolvedSessionId },
    });
  }, [isAuthenticated, resolvedSessionId, router]);

  return <>{children}</>;
}

function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    VT323: require("../assets/fonts/VT323-Regular.ttf"),
  });
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      // Hide the native splash screen — our animated one takes over
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <ConvexAuthProvider client={convex} storage={storage}>
      <DeepLinkHandler>
        <ThemeProvider value={belayQuestTheme}>
          <Stack>
            <Stack.Screen
              name="(authenticated)"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="(public)" options={{ headerShown: false }} />
          </Stack>
          {showSplash && <AnimatedSplash onFinish={handleSplashFinish} />}
        </ThemeProvider>
      </DeepLinkHandler>
    </ConvexAuthProvider>
  );
}

export default Sentry.wrap(RootLayout);
