import { Tabs } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { t } from "@/lib/copy/en";
import { COLORS } from "@/lib/theme";
import { PixelIcon } from "@/components/PixelIcon";
import type { IconName } from "@/assets/images/icons";

function tabIcon(name: IconName) {
  return ({ focused }: { focused: boolean }) => (
    <PixelIcon name={name} size={24} style={{ opacity: focused ? 1 : 0.5 }} />
  );
}

/** Request push notification permission and register Expo push token with Convex. */
function useRegisterPushToken() {
  const storePushToken = useMutation(api.users.storePushToken);

  useEffect(() => {
    // Push notifications only work on physical devices with native builds.
    // Skip on web.
    if (Platform.OS === "web") return;

    (async () => {
      try {
        const Notifications = await import("expo-notifications");

        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") return;

        const tokenData = await Notifications.getExpoPushTokenAsync();
        await storePushToken({ token: tokenData.data });
      } catch {
        // Silently fail — push notifications are non-critical
      }
    })();
  }, [storePushToken]);
}

export default function TabLayout() {
  useRegisterPushToken();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
        },
        tabBarLabelStyle: {
          fontFamily: "VT323",
          fontSize: 13,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tab.quests"),
          tabBarLabel: t("tab.quests"),
          tabBarIcon: tabIcon("scroll"),
        }}
      />
      <Tabs.Screen
        name="board"
        options={{
          title: t("tab.board"),
          tabBarLabel: t("tab.board"),
          tabBarIcon: tabIcon("signpost"),
        }}
      />
      <Tabs.Screen
        name="party"
        options={{
          title: t("tab.party"),
          tabBarLabel: t("tab.party"),
          tabBarIcon: tabIcon("handshake"),
        }}
      />
      <Tabs.Screen
        name="character"
        options={{
          title: t("tab.character"),
          tabBarLabel: t("tab.character"),
          tabBarIcon: tabIcon("shield"),
        }}
      />
    </Tabs>
  );
}
