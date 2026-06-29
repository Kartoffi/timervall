import { useFocusEffect } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";
import React, { useCallback, useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "../../i18n/useTranslation";
import Button from "../components/Button";
import Notification from "../components/Notification";
import Workout from "../components/Workout";

export default function Index() {
  const database = useSQLiteContext();
  const [workouts, setWorkouts] = useState<
    {
      id: number;
      name: string;
      completedSessionsCount: number;
      exercisesCount: number;
    }[]
  >([]);
  const [text, setText] = useState("");
  const [addWorkoutModalVisible, setAddWorkoutModalVisible] = useState(false);
  const [addingWorkout, setAddingWorkout] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
    key: number;
  } | null>(null);
  const { t } = useTranslation();

  const showNotification = useCallback(
    (message: string, type: "success" | "error") => {
      setNotification({ message, type, key: Date.now() });
    },
    [],
  );

  const onChangeText = (newText: string) => {
    setText(newText);
  };

  const fetchWorkouts = useCallback(async () => {
    try {
      const result: {
        id: number;
        name: string;
        completedSessionsCount: number;
        exercisesCount: number;
      }[] = await database.getAllAsync(
        `SELECT
          w.id,
          w.name,
          (
            SELECT COUNT(*)
            FROM workout_sessions ws
            WHERE ws.workout_id = w.id
              AND ws.workout_finished_at IS NOT NULL
              AND ws.deleted_at IS NULL
          ) AS completedSessionsCount,
          (
            SELECT COUNT(*)
            FROM workout_exercises we
            WHERE we.workout_id = w.id
              AND we.deleted_at IS NULL
          ) AS exercisesCount
        FROM workouts w
        WHERE w.deleted_at IS NULL
        ORDER BY w.id ASC;`,
      );
      setWorkouts(result);
    } catch (error) {
      console.error("Error fetching workouts:", error);
    }
  }, [database]);

  useFocusEffect(
    React.useCallback(() => {
      fetchWorkouts();
    }, [fetchWorkouts]),
  );

  const handleAddWorkout = async () => {
    if (addingWorkout) return;

    const trimmedName = text.trim();
    if (trimmedName.length === 0) return;

    setAddingWorkout(true);
    try {
      await database.runAsync("INSERT INTO workouts (name) VALUES (?);", [
        trimmedName,
      ]);
      setText(""); // Clear input after adding
      await fetchWorkouts(); // Refresh list after adding
      setAddWorkoutModalVisible(false);
    } catch (error) {
      console.error("Error adding workout:", error);
    } finally {
      setAddingWorkout(false);
    }
  };

  const handleDeleteWorkout = async (workoutId: number) => {
    try {
      await database.runAsync(
        "UPDATE workouts SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?;",
        [workoutId],
      );
      await fetchWorkouts();
      showNotification(t("workoutDeleted"), "success");
    } catch (error) {
      console.error("Error deleting workout:", error);
      showNotification(t("couldNotDeleteWorkout"), "error");
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
      >
        {workouts.map((workout) => (
          <Workout
            key={workout.id}
            workout={workout}
            onDelete={handleDeleteWorkout}
          />
        ))}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button
          label={t("addWorkout")}
          action={() => setAddWorkoutModalVisible(true)}
          disabled={addingWorkout}
        />
      </View>

      <Modal
        visible={addWorkoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setAddWorkoutModalVisible(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t("addWorkoutTitle")}</Text>
            <TextInput
              style={styles.input}
              onChangeText={onChangeText}
              value={text}
              placeholder={t("workoutNamePlaceholder")}
            />
            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setAddWorkoutModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>{t("cancel")}</Text>
              </Pressable>
              <Button
                label={addingWorkout ? t("adding") : t("saveWorkout")}
                action={handleAddWorkout}
                disabled={addingWorkout || text.trim().length === 0}
              />
            </View>
          </View>
        </View>
      </Modal>
      <Notification
        key={notification?.key ?? 0}
        message={notification?.message ?? null}
        type={notification?.type ?? "success"}
        duration={3000}
        onHide={() => setNotification(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  link: {
    marginTop: 20,
    color: "blue",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  listContainer: {
    flex: 1,
    width: "100%",
  },
  listContent: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 16,
  },
  bottomBar: {
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginTop: 20,
    paddingHorizontal: 10,
    width: "80%",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 6,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#666",
  },
});
