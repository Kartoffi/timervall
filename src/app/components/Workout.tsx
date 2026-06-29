import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "../../i18n/useTranslation";

type Props = {
  workout: {
    id: number;
    name: string;
    completedSessionsCount: number;
    exercisesCount: number;
  };
  onDelete: (workoutId: number) => Promise<void>;
};

export default function Workout({ workout, onDelete }: Props) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useTranslation();
  const completedSessionsLabel =
    workout.completedSessionsCount === 1
      ? t("completedSessionSingular")
      : t("completedSessionPlural");
  const exercisesLabel =
    workout.exercisesCount === 1 ? t("exerciseSingular") : t("exercisePlural");

  return (
    <Pressable
      style={styles.workoutContainer}
      onPress={() => router.push(`/workouts/${workout.id}`)}
    >
      <View style={styles.headerRow}>
        <View style={styles.workout}>
          <Text style={styles.workoutText}>{workout.name}</Text>
        </View>
        <Pressable
          style={styles.menuTrigger}
          onPress={(event) => {
            event.stopPropagation();
            setMenuOpen((previous) => !previous);
          }}
        >
          <Text style={styles.menuTriggerText}>⋯</Text>
        </Pressable>
      </View>
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {workout.exercisesCount} {exercisesLabel}
        </Text>
        <Text style={styles.statsText}>
          {workout.completedSessionsCount} {completedSessionsLabel}
        </Text>
      </View>
      {menuOpen ? (
        <>
          <Pressable
            style={styles.menuBackdrop}
            onPress={(event) => {
              event.stopPropagation();
              setMenuOpen(false);
            }}
          />
          <View style={styles.menuContainer}>
            <Pressable
              style={styles.menuItem}
              onPress={async (event) => {
                event.stopPropagation();
                setMenuOpen(false);
                await onDelete(workout.id);
              }}
            >
              <Text style={styles.menuItemDeleteText}>
                {t("deleteWorkout")}
              </Text>
            </Pressable>
          </View>
        </>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  workoutContainer: {
    position: "relative",
    overflow: "visible",
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#e3f0f9ff",
    backgroundColor: "#e3f0f9ff",
    borderStyle: "solid",
    padding: 25,
    borderRadius: 5,
    width: "90%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    marginBottom: 12,
  },
  workout: {
    alignItems: "flex-start",
    flex: 1,
  },
  workoutText: {
    fontSize: 20,
    color: "#4b7c9dff",
    textAlign: "left",
  },
  statsContainer: {
    gap: 16,
    flexDirection: "row",
    marginTop: 6,
  },
  statsText: {
    fontSize: 13,
    color: "#4b7c9dff",
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#4b7c9dff",
    backgroundColor: "#eef8ffff",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 50,
  },
  menuTrigger: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  menuTriggerText: {
    fontSize: 18,
    color: "#4b7c9dff",
    fontWeight: "700",
  },
  menuContainer: {
    position: "absolute",
    top: 50,
    right: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    zIndex: 20,
    elevation: 3,
  },
  menuBackdrop: {
    position: "absolute",
    top: -2000,
    right: -2000,
    bottom: -2000,
    left: -2000,
    zIndex: 10,
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
