import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  label: string;
  action: () => void;
  disabled?: boolean;
};

export default function Button({ label, action, disabled = false }: Props) {
  const db = useSQLiteContext();
  const [primaryColor, setPrimaryColor] = useState("#813dffff"); // fallback color

  useEffect(() => {
    const fetchColor = async () => {
      try {
        const result = (await db.getFirstAsync(
          "SELECT value FROM settings WHERE id = ?",
          [2],
        )) as { value?: string } | undefined;

        if (result && result.value) setPrimaryColor(result.value);
      } catch (e) {
        console.error("Error fetching primary color:", e);
      }
    };
    fetchColor();
  }, [db]);
  return (
    <View
      style={[
        styles.buttonContainer,
        {
          borderColor: primaryColor,
          backgroundColor: disabled ? "#f0f0f0" : primaryColor,
        },
      ]}
    >
      <Pressable
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={disabled ? undefined : action}
        disabled={disabled}
      >
        <Text style={[styles.buttonText, disabled && styles.textDisabled]}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    marginTop: 20,
    borderWidth: 1,
    borderStyle: "solid",
    padding: 15,
    borderRadius: 5,
  },
  button: {
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    color: "#ffffffff",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  textDisabled: {
    color: "#888",
  },
});
