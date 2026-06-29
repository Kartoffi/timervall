import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { dropAndCreateTables } from "../../database/setupDatabase";
import {
  AppLanguage,
  updateLanguageSetting,
  useTranslation,
} from "../../i18n/useTranslation";
import Button from "../components/Button";

export default function Options() {
  const database = useSQLiteContext();
  const router = useRouter();
  const [resetting, setResetting] = useState(false);
  const [changingLanguage, setChangingLanguage] = useState(false);
  const { language, t, refreshLanguage } = useTranslation();

  const handleDeleteAll = async () => {
    if (resetting) return;
    setResetting(true);
    try {
      await dropAndCreateTables(database);
      // Wait briefly to ensure tables are created before fetching
      await new Promise((resolve) => setTimeout(resolve, 150));
      await fetchCategories();
      await fetchSettings();
      await refreshLanguage();
      Alert.alert(t("resetSuccessTitle"), t("resetSuccessMessage"));
      // Navigate to workouts tab to trigger re-fetch
      router.replace("/");
    } catch (error) {
      console.error("Failed to reset data:", error);
      Alert.alert(
        t("errorTitle"),
        `${t("resetFailedPrefix")}: ${error instanceof Error ? error.message : String(error)}`,
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

  const handleChangeLanguage = async (nextLanguage: AppLanguage) => {
    if (changingLanguage || language === nextLanguage) return;
    setChangingLanguage(true);

    try {
      await updateLanguageSetting(database, nextLanguage);
      await refreshLanguage();
    } catch (error) {
      console.error("Error updating language:", error);
      Alert.alert(t("errorTitle"), String(error));
    } finally {
      setChangingLanguage(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("optionsTitle")}</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("language")}</Text>
        <View style={styles.languageRow}>
          <Pressable
            style={[
              styles.languageButton,
              language === "de" && styles.languageButtonActive,
            ]}
            onPress={() => handleChangeLanguage("de")}
            disabled={changingLanguage}
          >
            <Text style={styles.languageButtonText}>{t("languageGerman")}</Text>
          </Pressable>
          <Pressable
            style={[
              styles.languageButton,
              language === "en" && styles.languageButtonActive,
            ]}
            onPress={() => handleChangeLanguage("en")}
            disabled={changingLanguage}
          >
            <Text style={styles.languageButtonText}>
              {t("languageEnglish")}
            </Text>
          </Pressable>
        </View>
      </View>

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
        label={t("deleteAllData")}
        action={handleDeleteAll}
        disabled={resetting || changingLanguage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  section: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  languageRow: {
    flexDirection: "row",
    gap: 10,
  },
  languageButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#f6f6f6",
  },
  languageButtonActive: {
    borderColor: "#333",
    backgroundColor: "#e9e9e9",
  },
  languageButtonText: {
    fontSize: 14,
  },
});
