import { Stack, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useCallback, useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "../../i18n/useTranslation";
import Button from "../components/Button";
import Exercise from "../components/Exercise";
import Notification from "../components/Notification";

type ExerciseType = {
  id: number;
  name: string;
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  containerContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 72,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 10,
    width: "100%",
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 8,
  },
  exerciseItem: {
    fontSize: 16,
    marginBottom: 6,
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
    gap: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  notesInput: {
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 6,
    minHeight: 80,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlignVertical: "top",
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 6,
  },
  typeOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    marginTop: 8,
  },
  typeOptionSelected: {
    borderColor: "#333",
    backgroundColor: "#efefef",
  },
  typeOptionText: {
    fontSize: 15,
  },
  dropdownTrigger: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
  },
  dropdownTriggerOpen: {
    borderColor: "#666",
  },
  dropdownTriggerText: {
    fontSize: 15,
  },
  dropdownChevron: {
    fontSize: 14,
    color: "#666",
  },
  typeOptionsContainer: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    overflow: "hidden",
  },
  typeOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  typeOptionRowLast: {
    borderBottomWidth: 0,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
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

export default function WorkoutDetails() {
  const database = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const workoutId = Array.isArray(id) ? id[0] : id;
  const [workout, setWorkout] = useState<{ id: number; name: string } | null>(
    null,
  );
  const [exercises, setExercises] = useState<
    {
      id: number;
      name: string;
      notes: string | null;
      has_weight: number;
      type_name: string;
    }[]
  >([]);
  const [exerciseTypes, setExerciseTypes] = useState<ExerciseType[]>([]);
  const [exerciseCount, setExerciseCount] = useState(0);
  const [addingExercise, setAddingExercise] = useState(false);
  const [addExerciseModalVisible, setAddExerciseModalVisible] = useState(false);
  const [exerciseName, setExerciseName] = useState("");
  const [exerciseNotes, setExerciseNotes] = useState("");
  const [exerciseHasWeight, setExerciseHasWeight] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
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

  const resetAddExerciseForm = () => {
    setExerciseName("");
    setExerciseNotes("");
    setExerciseHasWeight(false);
  };

  const openAddExerciseModal = () => {
    resetAddExerciseForm();
    setTypeDropdownOpen(false);
    setAddExerciseModalVisible(true);
  };

  const closeAddExerciseModal = () => {
    setTypeDropdownOpen(false);
    setAddExerciseModalVisible(false);
  };

  const fetchExercises = useCallback(async () => {
    const parsedWorkoutId = Number(workoutId);
    if (!Number.isInteger(parsedWorkoutId)) {
      setExercises([]);
      setExerciseCount(0);
      return;
    }

    try {
      const result = (await database.getAllAsync(
        `SELECT
          we.id,
          we.name,
          we.notes,
          we.has_weight,
          et.name as type_name
        FROM workout_exercises we
        JOIN exercise_types et ON et.id = we.type_id
        WHERE we.workout_id = ?
          AND we.deleted_at IS NULL
        ORDER BY we.id ASC;`,
        [parsedWorkoutId],
      )) as {
        id: number;
        name: string;
        notes: string | null;
        has_weight: number;
        type_name: string;
      }[];
      setExercises(result);
      setExerciseCount(result.length);
    } catch (error) {
      console.error("Error fetching exercises:", error);
    }
  }, [database, workoutId]);

  useEffect(() => {
    const parsedWorkoutId = Number(workoutId);
    if (!Number.isInteger(parsedWorkoutId)) {
      setWorkout(null);
      return;
    }

    const fetchWorkoutDetails = async () => {
      try {
        const result: { id: number; name: string } | null | undefined =
          await database.getFirstAsync("SELECT * FROM workouts WHERE id = ?;", [
            parsedWorkoutId,
          ]);
        if (result) {
          setWorkout(result);
        }
      } catch (error) {
        console.error("Error fetching workout details:", error);
      }
    };

    fetchWorkoutDetails();
  }, [database, workoutId]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  useEffect(() => {
    const fetchExerciseTypes = async () => {
      try {
        const result = (await database.getAllAsync(
          "SELECT id, name FROM exercise_types ORDER BY id ASC;",
        )) as ExerciseType[];
        setExerciseTypes(result);

        const repeatsType = result.find((type) => type.name === "repeats");
        if (repeatsType) {
          setSelectedTypeId(repeatsType.id);
          return;
        }

        if (result.length > 0) {
          setSelectedTypeId(result[0].id);
        }
      } catch (error) {
        console.error("Error fetching exercise types:", error);
      }
    };

    fetchExerciseTypes();
  }, [database]);

  const handleAddExercise = async () => {
    if (addingExercise) return;

    const parsedWorkoutId = Number(workoutId);
    if (!Number.isInteger(parsedWorkoutId)) return;

    setAddingExercise(true);
    try {
      const typeResult = (await database.getFirstAsync(
        "SELECT id FROM exercise_types WHERE id = ? LIMIT 1;",
        [selectedTypeId],
      )) as { id?: number } | null;

      const repeatsTypeId = typeResult?.id;
      if (!repeatsTypeId) {
        throw new Error("Selected exercise type not found.");
      }

      const trimmedExerciseName = exerciseName.trim();
      const nextExerciseName =
        trimmedExerciseName.length > 0
          ? trimmedExerciseName
          : `Exercise ${exerciseCount + 1}`;
      await database.runAsync(
        "INSERT INTO workout_exercises (name, notes, workout_id, type_id, has_weight) VALUES (?, ?, ?, ?, ?);",
        [
          nextExerciseName,
          exerciseNotes.trim().length > 0 ? exerciseNotes.trim() : null,
          parsedWorkoutId,
          repeatsTypeId,
          exerciseHasWeight ? 1 : 0,
        ],
      );
      closeAddExerciseModal();
      resetAddExerciseForm();
      await fetchExercises();
    } catch (error) {
      console.error("Error adding exercise:", error);
    } finally {
      setAddingExercise(false);
    }
  };

  const parseTimeToSeconds = (value: string) => {
    const MAX_TIME_PART = 60;
    const MAX_SECONDS_PART = 59;
    const MAX_TOTAL_SECONDS = MAX_TIME_PART * 60 + MAX_SECONDS_PART;
    const trimmed = value.trim();
    if (!trimmed) return null;

    const colonParts = trimmed.split(":");
    if (colonParts.length === 2) {
      const minutes = Number(colonParts[0]);
      const seconds = Number(colonParts[1]);
      if (
        Number.isInteger(minutes) &&
        Number.isInteger(seconds) &&
        minutes >= 0 &&
        minutes <= MAX_TIME_PART &&
        seconds >= 0 &&
        seconds <= MAX_SECONDS_PART
      ) {
        return minutes * 60 + seconds;
      }
      return null;
    }

    const numericSeconds = Number(trimmed);
    if (
      Number.isInteger(numericSeconds) &&
      numericSeconds >= 0 &&
      numericSeconds <= MAX_TOTAL_SECONDS
    ) {
      return numericSeconds;
    }
    return null;
  };

  const handleSaveSet = useCallback(
    async ({
      workoutExerciseId,
      setId,
      exerciseTypeValue,
      weight,
      restTime,
      isTimerType,
      hasWeight,
    }: {
      workoutExerciseId: number;
      setId: number | null;
      exerciseTypeValue: string;
      weight: string;
      restTime: string;
      isTimerType: boolean;
      hasWeight: number;
    }) => {
      const parsedWorkoutId = Number(workoutId);
      if (!Number.isInteger(parsedWorkoutId)) {
        return null;
      }

      const parsedExerciseTypeValue = isTimerType
        ? parseTimeToSeconds(exerciseTypeValue)
        : Number.parseInt(exerciseTypeValue.trim(), 10);

      if (
        parsedExerciseTypeValue === null ||
        !Number.isInteger(parsedExerciseTypeValue) ||
        parsedExerciseTypeValue < 0
      ) {
        return null;
      }

      if (isTimerType && parsedExerciseTypeValue < 5) {
        return null;
      }

      const parsedRestTime = parseTimeToSeconds(restTime);
      if (parsedRestTime === null || parsedRestTime < 5) {
        return null;
      }

      let parsedWeight: number | null = null;
      if (hasWeight) {
        const weightValue = Number(weight.trim().replace(",", "."));
        if (!Number.isFinite(weightValue) || weightValue < 0) {
          return null;
        }
        parsedWeight = weightValue;
      }

      try {
        const activeSession = (await database.getFirstAsync(
          "SELECT id FROM workout_sessions WHERE workout_id = ? AND workout_finished_at IS NULL ORDER BY id DESC LIMIT 1;",
          [parsedWorkoutId],
        )) as { id?: number } | null;

        let workoutSessionId = activeSession?.id;
        if (!workoutSessionId) {
          const insertedSession = await database.runAsync(
            "INSERT INTO workout_sessions (workout_id, workout_begin_at, workout_finished_at) VALUES (?, CURRENT_TIMESTAMP, NULL);",
            [parsedWorkoutId],
          );
          workoutSessionId = insertedSession.lastInsertRowId;
        }

        const existingSessionExercise = (await database.getFirstAsync(
          "SELECT id FROM workout_session_exercises WHERE workout_session_id = ? AND workout_exercise_id = ? ORDER BY id DESC LIMIT 1;",
          [workoutSessionId, workoutExerciseId],
        )) as { id?: number } | null;

        let workoutSessionExerciseId = existingSessionExercise?.id;
        if (!workoutSessionExerciseId) {
          const nextPositionResult = (await database.getFirstAsync(
            "SELECT COALESCE(MAX(position), 0) + 1 AS next_position FROM workout_session_exercises WHERE workout_session_id = ?;",
            [workoutSessionId],
          )) as { next_position?: number } | null;

          const insertedSessionExercise = await database.runAsync(
            "INSERT INTO workout_session_exercises (workout_session_id, workout_exercise_id, position) VALUES (?, ?, ?);",
            [
              workoutSessionId,
              workoutExerciseId,
              nextPositionResult?.next_position ?? 1,
            ],
          );
          workoutSessionExerciseId = insertedSessionExercise.lastInsertRowId;
        }

        let persistedSetId = setId;
        let persistedCreatedAt: string | null = null;

        if (persistedSetId) {
          await database.runAsync(
            `UPDATE workout_session_exercise_sets
             SET exercise_type_value = ?,
                 weight = ?,
                 rest_time = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND workout_session_exercise_id = ?;`,
            [
              parsedExerciseTypeValue,
              parsedWeight,
              parsedRestTime,
              persistedSetId,
              workoutSessionExerciseId,
            ],
          );
        } else {
          const nextSetNumberResult = (await database.getFirstAsync(
            "SELECT COALESCE(MAX(set_number), 0) + 1 AS next_set_number FROM workout_session_exercise_sets WHERE workout_session_exercise_id = ?;",
            [workoutSessionExerciseId],
          )) as { next_set_number?: number } | null;

          const insertedSet = await database.runAsync(
            `INSERT INTO workout_session_exercise_sets
              (workout_session_exercise_id, set_number, exercise_type_value, weight, rest_time)
             VALUES (?, ?, ?, ?, ?);`,
            [
              workoutSessionExerciseId,
              nextSetNumberResult?.next_set_number ?? 1,
              parsedExerciseTypeValue,
              parsedWeight,
              parsedRestTime,
            ],
          );

          persistedSetId = insertedSet.lastInsertRowId;
        }

        const savedRow = (await database.getFirstAsync(
          "SELECT id, created_at FROM workout_session_exercise_sets WHERE id = ? LIMIT 1;",
          [persistedSetId],
        )) as { id?: number; created_at?: string } | null;

        persistedSetId = savedRow?.id ?? persistedSetId;
        persistedCreatedAt = savedRow?.created_at ?? null;

        if (!persistedSetId) {
          return null;
        }

        return {
          setId: persistedSetId,
          createdAt: persistedCreatedAt ?? new Date().toISOString(),
          exerciseTypeValue: parsedExerciseTypeValue,
          weight: parsedWeight,
          restTime: parsedRestTime,
        };
      } catch (error) {
        console.error("Error saving set:", error);
        return null;
      }
    },
    [database, workoutId],
  );

  const handleLoadSets = useCallback(
    async (workoutExerciseId: number) => {
      const parsedWorkoutId = Number(workoutId);
      if (!Number.isInteger(parsedWorkoutId)) {
        return [];
      }

      try {
        const latestSessionExercise = (await database.getFirstAsync(
          `SELECT wse.id
           FROM workout_session_exercises wse
           JOIN workout_sessions ws ON ws.id = wse.workout_session_id
           WHERE ws.workout_id = ?
             AND wse.workout_exercise_id = ?
             AND ws.deleted_at IS NULL
             AND wse.deleted_at IS NULL
           ORDER BY (ws.workout_finished_at IS NULL) DESC, ws.id DESC, wse.id DESC
           LIMIT 1;`,
          [parsedWorkoutId, workoutExerciseId],
        )) as { id?: number } | null;

        if (!latestSessionExercise?.id) {
          return [];
        }

        const result = (await database.getAllAsync(
          `SELECT
            id,
            created_at,
            exercise_type_value,
            weight,
            rest_time
          FROM workout_session_exercise_sets
          WHERE workout_session_exercise_id = ?
          ORDER BY datetime(created_at) ASC, id ASC;`,
          [latestSessionExercise.id],
        )) as {
          id: number;
          created_at: string;
          exercise_type_value: number;
          weight: number | null;
          rest_time: number;
        }[];

        return result.map((row) => ({
          id: row.id,
          createdAt: row.created_at,
          exerciseTypeValue: row.exercise_type_value,
          weight: row.weight,
          restTime: row.rest_time,
        }));
      } catch (error) {
        console.error("Error loading sets:", error);
        return [];
      }
    },
    [database, workoutId],
  );

  const handleDeleteSet = useCallback(
    async ({
      workoutExerciseId,
      setId,
    }: {
      workoutExerciseId: number;
      setId: number;
    }) => {
      const parsedWorkoutId = Number(workoutId);
      if (!Number.isInteger(parsedWorkoutId)) {
        return false;
      }

      try {
        const latestSessionExercise = (await database.getFirstAsync(
          `SELECT wse.id
           FROM workout_session_exercises wse
           JOIN workout_sessions ws ON ws.id = wse.workout_session_id
           WHERE ws.workout_id = ?
             AND wse.workout_exercise_id = ?
             AND ws.deleted_at IS NULL
             AND wse.deleted_at IS NULL
           ORDER BY (ws.workout_finished_at IS NULL) DESC, ws.id DESC, wse.id DESC
           LIMIT 1;`,
          [parsedWorkoutId, workoutExerciseId],
        )) as { id?: number } | null;

        if (!latestSessionExercise?.id) {
          return false;
        }

        await database.runAsync(
          "DELETE FROM workout_session_exercise_sets WHERE workout_session_exercise_id = ? AND id = ?;",
          [latestSessionExercise.id, setId],
        );

        return true;
      } catch (error) {
        console.error("Error deleting set:", error);
        return false;
      }
    },
    [database, workoutId],
  );

  const handleDeleteExercise = useCallback(
    async (workoutExerciseId: number) => {
      try {
        await database.runAsync(
          "UPDATE workout_exercises SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?;",
          [workoutExerciseId],
        );
        await fetchExercises();
        return true;
      } catch (error) {
        console.error("Error deleting exercise:", error);
        return false;
      }
    },
    [database, fetchExercises],
  );

  if (!workout) {
    return (
      <>
        <Stack.Screen
          options={{
            title: workoutId
              ? `${t("tabWorkouts")} ${workoutId}`
              : t("tabWorkouts"),
          }}
        />
        <View style={styles.container}>
          <Text>{t("loadingWorkoutDetails")}</Text>
        </View>
      </>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.containerContent}
        keyboardShouldPersistTaps="handled"
      >
        <Stack.Screen
          options={{
            title:
              workout?.name ??
              (workoutId
                ? `${t("tabWorkouts")} ${workoutId}`
                : t("tabWorkouts")),
          }}
        />
        <Text style={styles.title}>{workout.name}</Text>
        <Text style={styles.subtitle}>
          {t("exercisesCount")}: {exerciseCount}
        </Text>
        <Button
          label={t("addExercise")}
          action={openAddExerciseModal}
          disabled={addingExercise}
        />
        <Modal
          visible={addExerciseModalVisible}
          transparent
          animationType="fade"
          onRequestClose={closeAddExerciseModal}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{t("addExerciseTitle")}</Text>
              <TextInput
                style={styles.input}
                onChangeText={setExerciseName}
                value={exerciseName}
                placeholder={t("exerciseNamePlaceholder")}
              />
              <TextInput
                style={styles.notesInput}
                onChangeText={setExerciseNotes}
                value={exerciseNotes}
                placeholder={t("notesPlaceholder")}
                multiline
              />
              <View style={styles.rowBetween}>
                <Text>{t("containsWeights")}</Text>
                <Switch
                  value={exerciseHasWeight}
                  onValueChange={setExerciseHasWeight}
                />
              </View>

              <Text style={styles.typeLabel}>{t("type")}</Text>
              <Pressable
                style={[
                  styles.dropdownTrigger,
                  typeDropdownOpen && styles.dropdownTriggerOpen,
                ]}
                onPress={() => setTypeDropdownOpen((previous) => !previous)}
              >
                <Text style={styles.dropdownTriggerText}>
                  {exerciseTypes.find((type) => type.id === selectedTypeId)
                    ?.name ?? t("selectType")}
                </Text>
                <Text style={styles.dropdownChevron}>
                  {typeDropdownOpen ? "▲" : "▼"}
                </Text>
              </Pressable>

              {typeDropdownOpen ? (
                <View style={styles.typeOptionsContainer}>
                  {exerciseTypes.map((type, index) => {
                    const selected = selectedTypeId === type.id;
                    return (
                      <Pressable
                        key={type.id}
                        style={[
                          styles.typeOptionRow,
                          index === exerciseTypes.length - 1 &&
                            styles.typeOptionRowLast,
                          selected && styles.typeOptionSelected,
                        ]}
                        onPress={() => {
                          setSelectedTypeId(type.id);
                          setTypeDropdownOpen(false);
                        }}
                      >
                        <Text style={styles.typeOptionText}>{type.name}</Text>
                        <Text>{selected ? "✓" : ""}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}

              <View style={styles.modalActions}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={closeAddExerciseModal}
                >
                  <Text style={styles.cancelButtonText}>{t("cancel")}</Text>
                </Pressable>
                <Button
                  label={addingExercise ? t("adding") : t("saveExercise")}
                  action={handleAddExercise}
                  disabled={
                    addingExercise ||
                    !selectedTypeId ||
                    exerciseTypes.length === 0
                  }
                />
              </View>
            </View>
          </View>
        </Modal>
        <Text style={styles.listTitle}>{t("exerciseList")}</Text>
        {exercises.length === 0 ? (
          <Text style={styles.exerciseItem}>{t("noExercises")}</Text>
        ) : (
          exercises.map((exercise) => (
            <Exercise
              key={exercise.id}
              id={exercise.id}
              name={exercise.name}
              typeName={exercise.type_name}
              notes={exercise.notes}
              hasWeight={exercise.has_weight}
              onLoadSets={handleLoadSets}
              onSaveSet={handleSaveSet}
              onDeleteSet={handleDeleteSet}
              onDeleteExercise={handleDeleteExercise}
              onNotify={showNotification}
            />
          ))
        )}
      </ScrollView>
      <Notification
        key={notification?.key ?? 0}
        message={notification?.message ?? null}
        type={notification?.type ?? "success"}
        duration={3000}
        onHide={() => setNotification(null)}
      />
      {/* Additional workout details can be displayed here */}
    </View>
  );
}
