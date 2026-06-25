import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { dropAndCreateTables } from "../../database/setupDatabase";
import Button from "../components/Button";

export default function Options() {
  const database = useSQLiteContext();
  const router = useRouter();
  const [resetting, setResetting] = useState(false);

  const handleDeleteAll = async () => {
    if (resetting) return;
    setResetting(true);
    try {
      await dropAndCreateTables(database);
      // Wait briefly to ensure tables are created before fetching
      await new Promise((resolve) => setTimeout(resolve, 150));
      await fetchCategories();
      await fetchSettings();
      Alert.alert("Success", "All data and settings reset to default.");
      // Navigate to workouts tab to trigger re-fetch
      router.replace("/");
    } catch (error) {
      console.error("Failed to reset data:", error);
      Alert.alert(
        "Error",
        `Failed to reset data: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setResetting(false);
    }
  };

  // Fetches categories from the database and updates state
  async function fetchCategories() {
    try {
      const result = await database.getAllAsync(
        "SELECT id, name FROM setting_categories;",
      );
      setSettingCategories(result as { id: number; name: string }[]);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }

  // Fetches settings from the database and updates state
  async function fetchSettings() {
    try {
      const result = await database.getAllAsync("SELECT * FROM settings;");
      setSettings(
        result as {
          name: string;
          value: string;
          category_id: number;
          setting_type_id: number;
        }[],
      );
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  }

  const [settingCategories, setSettingCategories] = useState<
    { id: number; name: string }[]
  >([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await database.getAllAsync(
          "SELECT id, name FROM setting_categories;",
        );
        setSettingCategories(result as { id: number; name: string }[]);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, [database]);

  const [settings, setSettings] = useState<
    {
      name: string;
      value: string;
      category_id: number;
      setting_type_id: number;
    }[]
  >([]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const result = await database.getAllAsync("SELECT * FROM settings;");
        setSettings(
          result as {
            name: string;
            value: string;
            category_id: number;
            setting_type_id: number;
          }[],
        );
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, [database]);

  return (
    <View style={styles.container}>
      {settingCategories.map((category) => (
        <View key={category.id}>
          <Text>{category.name}</Text>
          {settings
            .filter((setting) => setting.category_id === category.id)
            .map((setting) => (
              <Text key={setting.name}>
                {setting.name}: {setting.value}
              </Text>
            ))}
        </View>
      ))}
      <Button
        label="Delete All Data"
        action={handleDeleteAll}
        disabled={resetting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
