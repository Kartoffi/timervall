import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { useTranslation } from "../../i18n/useTranslation";

export default function TabLayout() {
  const db = useSQLiteContext();
  const [primaryColor, setPrimaryColor] = useState("#813dffff"); // fallback color
  const { t } = useTranslation();

  useEffect(() => {
    const fetchColor = async () => {
      try {
        const result = (await db.getFirstAsync(
          "SELECT value FROM settings WHERE name = ?",
          ["primary_color"],
        )) as { value?: string } | undefined;

        if (result && result.value) setPrimaryColor(result.value);
      } catch (e) {
        console.error("Error fetching primary color:", e);
      }
    };
    fetchColor();
  }, [db]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: primaryColor,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabWorkouts"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "barbell" : "barbell-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="options"
        options={{
          title: t("tabOptions"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}
