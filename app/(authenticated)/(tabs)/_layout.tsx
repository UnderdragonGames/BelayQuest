import { Tabs } from "expo-router";
import { t } from "@/lib/copy/en";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#f4a261",
        tabBarInactiveTintColor: "#666680",
        tabBarStyle: {
          backgroundColor: "#16213e",
          borderTopColor: "#2a2a4a",
        },
        headerStyle: {
          backgroundColor: "#1a1a2e",
        },
        headerTintColor: "#eaeaea",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tab.quests"),
          tabBarLabel: t("tab.quests"),
        }}
      />
      <Tabs.Screen
        name="board"
        options={{
          title: t("tab.board"),
          tabBarLabel: t("tab.board"),
        }}
      />
      <Tabs.Screen
        name="party"
        options={{
          title: t("tab.party"),
          tabBarLabel: t("tab.party"),
        }}
      />
      <Tabs.Screen
        name="character"
        options={{
          title: t("tab.character"),
          tabBarLabel: t("tab.character"),
        }}
      />
    </Tabs>
  );
}
