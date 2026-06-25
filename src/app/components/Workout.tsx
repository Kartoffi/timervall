import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "../../i18n/useTranslation";

type Props = {
  id: number;
  label: string;
  onDelete: (workoutId: number) => Promise<void>;
};

export default function Workout({ id, label, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <View style={styles.workoutContainer}>
      <View style={styles.headerRow}>
        <Link href={`/workouts/${id}`} style={styles.workout}>
          <Text style={styles.workoutText}>{label}</Text>
        </Link>
        <Pressable
          style={styles.menuTrigger}
          onPress={() => setMenuOpen((previous) => !previous)}
        >
          <Text style={styles.menuTriggerText}>⋯</Text>
        </Pressable>
      </View>
      {menuOpen ? (
        <View style={styles.menuContainer}>
          <Pressable
            style={styles.menuItem}
            onPress={async () => {
              setMenuOpen(false);
              await onDelete(id);
            }}
          >
            <Text style={styles.menuItemDeleteText}>{t("deleteWorkout")}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  workoutContainer: {
    position: "relative",
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#000",
    borderStyle: "solid",
    padding: 25,
    borderRadius: 5,
    width: "80%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  workout: {
    alignItems: "center",
    flex: 1,
  },
  workoutText: {
    fontSize: 20,
    color: "#000",
  },
  menuTrigger: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  menuTriggerText: {
    fontSize: 18,
    color: "#555",
    fontWeight: "700",
  },
  menuContainer: {
    position: "absolute",
    top: 36,
    right: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    zIndex: 20,
    elevation: 3,
  },
  menuItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  menuItemDeleteText: {
    color: "#c62828",
    fontWeight: "600",
    fontSize: 13,
  },
});
