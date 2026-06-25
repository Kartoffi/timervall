import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useRef, useState } from "react";
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useTranslation } from "../../i18n/useTranslation";

type Props = {
  id: number;
  name: string;
  typeName: string;
  notes: string | null;
  hasWeight: number;
  onLoadSets: (workoutExerciseId: number) => Promise<
    {
      id: number;
      createdAt: string;
      exerciseTypeValue: number;
      weight: number | null;
      restTime: number;
    }[]
  >;
  onSaveSet: (input: {
    workoutExerciseId: number;
    setId: number | null;
    exerciseTypeValue: string;
    weight: string;
    restTime: string;
    isTimerType: boolean;
    hasWeight: number;
  }) => Promise<{
    setId: number;
    createdAt: string;
    exerciseTypeValue: number;
    weight: number | null;
    restTime: number;
  } | null>;
  onDeleteSet: (input: {
    workoutExerciseId: number;
    setId: number;
  }) => Promise<boolean>;
  onDeleteExercise: (workoutExerciseId: number) => Promise<boolean>;
  onNotify: (message: string, type: "success" | "error") => void;
};

type ExerciseSet = {
  id: number;
  persistedSetId: number | null;
  createdAt: string | null;
  exerciseTypeValue: string;
  weight: string;
  restTime: string;
  saved: boolean;
  savedExerciseTypeValue: number | null;
  savedWeight: number | null;
  savedRestTime: number | null;
  editingField: "exerciseTypeValue" | "weight" | "restTime" | null;
};

type TimerField = "exerciseTypeValue" | "restTime";

type CountdownState = {
  initialSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
};

export default function Exercise({
  id,
  name,
  typeName,
  notes,
  hasWeight,
  onLoadSets,
  onSaveSet,
  onDeleteSet,
  onDeleteExercise,
  onNotify,
}: Props) {
  const [collapsed, setCollapsed] = useState(true);
  const [sets, setSets] = useState<ExerciseSet[]>([]);
  const [savingSetId, setSavingSetId] = useState<number | null>(null);
  const [loadingSets, setLoadingSets] = useState(false);
  const [menuSetId, setMenuSetId] = useState<number | null>(null);
  const [exerciseMenuOpen, setExerciseMenuOpen] = useState(false);
  const [countdowns, setCountdowns] = useState<Record<string, CountdownState>>(
    {},
  );
  const setsRef = useRef<ExerciseSet[]>([]);
  const MAX_TIME_PART = 60;
  const MAX_SECONDS_PART = 59;
  const { t } = useTranslation();

  const isTimerType = typeName.toLowerCase() === "timer";

  const formatSeconds = (totalSeconds: number) => {
    const safeSeconds = Number.isFinite(totalSeconds)
      ? Math.max(0, Math.floor(totalSeconds))
      : 0;
    const minutes = Math.floor(safeSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (safeSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const parseTimeToSeconds = (value: string) => {
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
      numericSeconds <= MAX_TIME_PART * 60 + MAX_SECONDS_PART
    ) {
      return numericSeconds;
    }

    return null;
  };

  const getTimerKey = (setId: number, field: TimerField) => `${setId}:${field}`;

  const getConfiguredSeconds = (set: ExerciseSet, field: TimerField) => {
    if (
      field === "exerciseTypeValue" &&
      isTimerType &&
      set.saved &&
      set.savedExerciseTypeValue !== null &&
      set.editingField !== "exerciseTypeValue"
    ) {
      return Math.max(0, set.savedExerciseTypeValue);
    }

    if (
      field === "restTime" &&
      set.saved &&
      set.savedRestTime !== null &&
      set.editingField !== "restTime"
    ) {
      return Math.max(0, set.savedRestTime);
    }

    return parseTimeToSeconds(set[field]) ?? 0;
  };

  const clearCountdownForField = (setId: number, field: TimerField) => {
    const key = getTimerKey(setId, field);
    setCountdowns((previous) => {
      if (!previous[key]) {
        return previous;
      }

      const next = { ...previous };
      delete next[key];
      return next;
    });
  };

  const startCountdown = (set: ExerciseSet, field: TimerField) => {
    const configuredSeconds = getConfiguredSeconds(set, field);
    if (configuredSeconds <= 0) {
      return;
    }

    const key = getTimerKey(set.id, field);
    setCountdowns((previous) => {
      const existing = previous[key];
      const baseState =
        existing && existing.initialSeconds === configuredSeconds
          ? existing
          : {
              initialSeconds: configuredSeconds,
              remainingSeconds: configuredSeconds,
              isRunning: false,
            };

      return {
        ...previous,
        [key]: {
          ...baseState,
          remainingSeconds:
            baseState.remainingSeconds > 0
              ? baseState.remainingSeconds
              : configuredSeconds,
          isRunning: true,
        },
      };
    });
  };

  const pauseCountdown = (setId: number, field: TimerField) => {
    const key = getTimerKey(setId, field);
    setCountdowns((previous) => {
      const existing = previous[key];
      if (!existing) {
        return previous;
      }

      return {
        ...previous,
        [key]: {
          ...existing,
          isRunning: false,
        },
      };
    });
  };

  const resetCountdown = (set: ExerciseSet, field: TimerField) => {
    const configuredSeconds = getConfiguredSeconds(set, field);
    const key = getTimerKey(set.id, field);

    if (configuredSeconds <= 0) {
      setCountdowns((previous) => {
        if (!previous[key]) {
          return previous;
        }

        const next = { ...previous };
        delete next[key];
        return next;
      });
      return;
    }

    setCountdowns((previous) => ({
      ...previous,
      [key]: {
        initialSeconds: configuredSeconds,
        remainingSeconds: configuredSeconds,
        isRunning: false,
      },
    }));
  };

  const renderCountdownControls = (set: ExerciseSet, field: TimerField) => {
    const key = getTimerKey(set.id, field);
    const countdown = countdowns[key];
    const configuredSeconds = getConfiguredSeconds(set, field);
    const remainingSeconds = countdown
      ? countdown.remainingSeconds
      : configuredSeconds;
    const isRunning = countdown?.isRunning ?? false;

    return (
      <View style={styles.timerControlsRow}>
        <Text style={styles.timerCountdownText}>
          {formatSeconds(remainingSeconds)}
        </Text>
        <Pressable
          style={styles.timerControlButton}
          onPress={() =>
            isRunning
              ? pauseCountdown(set.id, field)
              : startCountdown(set, field)
          }
        >
          <View style={styles.timerControlButtonContent}>
            <Ionicons
              name={isRunning ? "pause" : "play"}
              size={12}
              color="#333"
            />
          </View>
        </Pressable>
        <Pressable
          style={styles.timerControlButton}
          onPress={() => resetCountdown(set, field)}
        >
          <View style={styles.timerControlButtonContent}>
            <Ionicons name="refresh" size={12} color="#333" />
          </View>
        </Pressable>
      </View>
    );
  };

  const addSet = () => {
    setSets((previous) => [
      ...previous,
      {
        id: Date.now() + previous.length,
        persistedSetId: null,
        createdAt: new Date().toISOString(),
        exerciseTypeValue: "",
        weight: "",
        restTime: "",
        saved: false,
        savedExerciseTypeValue: null,
        savedWeight: null,
        savedRestTime: null,
        editingField: null,
      },
    ]);
  };

  useEffect(() => {
    if (collapsed) return;

    const loadSavedSets = async () => {
      setLoadingSets(true);
      try {
        const savedSets = await onLoadSets(id);
        setSets((previous) => {
          const unsavedSets = previous.filter((set) => !set.saved);
          const mappedSavedSets: ExerciseSet[] = savedSets.map((savedSet) => ({
            id: savedSet.id,
            persistedSetId: savedSet.id,
            createdAt: savedSet.createdAt,
            exerciseTypeValue: isTimerType
              ? formatSeconds(savedSet.exerciseTypeValue)
              : String(savedSet.exerciseTypeValue),
            weight: savedSet.weight === null ? "" : savedSet.weight.toFixed(2),
            restTime: formatSeconds(savedSet.restTime),
            saved: true,
            savedExerciseTypeValue: savedSet.exerciseTypeValue,
            savedWeight: savedSet.weight,
            savedRestTime: savedSet.restTime,
            editingField: null,
          }));

          return [...mappedSavedSets, ...unsavedSets];
        });
      } catch (error) {
        console.error("Error loading sets:", error);
      } finally {
        setLoadingSets(false);
      }
    };

    loadSavedSets();
  }, [collapsed, id, isTimerType, onLoadSets]);

  const updateSet = (
    setId: number,
    field: "exerciseTypeValue" | "weight" | "restTime",
    value: string,
  ) => {
    if (field === "exerciseTypeValue" || field === "restTime") {
      clearCountdownForField(setId, field);
    }

    setSets((previous) =>
      previous.map((set) =>
        set.id === setId
          ? {
              ...set,
              [field]: value,
            }
          : set,
      ),
    );
  };

  const getTimeParts = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return { minutes: "", seconds: "" };
    }

    if (trimmed.includes(":")) {
      const [minutesRaw = "", secondsRaw = ""] = trimmed.split(":");
      const minutesDigits = minutesRaw.replace(/\D/g, "").slice(0, 2);
      const secondsDigits = secondsRaw.replace(/\D/g, "").slice(0, 2);
      return {
        minutes:
          minutesDigits.length > 0
            ? String(Number.parseInt(minutesDigits, 10)).padStart(2, "0")
            : "",
        seconds:
          secondsDigits.length > 0
            ? String(Number.parseInt(secondsDigits, 10)).padStart(2, "0")
            : "",
      };
    }

    const numericSeconds = Number.parseInt(trimmed.replace(/\D/g, ""), 10);
    if (!Number.isFinite(numericSeconds)) {
      return { minutes: "", seconds: "" };
    }

    const bounded = Math.max(
      0,
      Math.min(MAX_TIME_PART * 60 + MAX_SECONDS_PART, numericSeconds),
    );
    const minutes = Math.floor(bounded / 60);
    const seconds = bounded % 60;
    return {
      minutes: String(minutes).padStart(2, "0"),
      seconds: String(seconds).padStart(2, "0"),
    };
  };

  const composeTimeValue = (minutesText: string, secondsText: string) => {
    const minutesValue = minutesText ? Number.parseInt(minutesText, 10) : 0;
    const secondsValue = secondsText ? Number.parseInt(secondsText, 10) : 0;

    const boundedMinutes = Number.isFinite(minutesValue)
      ? Math.min(MAX_TIME_PART, Math.max(0, minutesValue))
      : 0;
    const boundedSeconds = Number.isFinite(secondsValue)
      ? Math.min(MAX_SECONDS_PART, Math.max(0, secondsValue))
      : 0;

    return `${boundedMinutes}:${boundedSeconds}`;
  };

  const updateTimePart = (
    setId: number,
    field: "exerciseTypeValue" | "restTime",
    part: "minutes" | "seconds",
    rawInput: string,
  ) => {
    const sanitized = rawInput.replace(/\D/g, "").slice(-2);
    const currentSet = setsRef.current.find((item) => item.id === setId);
    const currentValue = currentSet?.[field] ?? "";
    const currentParts = getTimeParts(currentValue);

    const nextMinutes = part === "minutes" ? sanitized : currentParts.minutes;
    const nextSeconds = part === "seconds" ? sanitized : currentParts.seconds;

    updateSet(setId, field, composeTimeValue(nextMinutes, nextSeconds));
  };

  const renderTimeInputs = (
    set: ExerciseSet,
    field: "exerciseTypeValue" | "restTime",
    withSaveAction = false,
  ) => {
    const parts = getTimeParts(set[field]);
    const minutesValue = parts.minutes;
    const secondsValue = parts.seconds;

    return (
      <View style={styles.timeInputRow}>
        <TextInput
          style={[styles.input, styles.timePartInput]}
          value={minutesValue}
          onChangeText={(value) =>
            updateTimePart(set.id, field, "minutes", value)
          }
          placeholder="mm"
          keyboardType="number-pad"
          autoFocus={withSaveAction}
          selectTextOnFocus
        />
        <Text style={styles.timeSeparator}>:</Text>
        <TextInput
          style={[styles.input, styles.timePartInput]}
          value={secondsValue}
          onChangeText={(value) =>
            updateTimePart(set.id, field, "seconds", value)
          }
          placeholder="ss"
          keyboardType="number-pad"
          selectTextOnFocus
        />
      </View>
    );
  };

  useEffect(() => {
    setsRef.current = sets;
  }, [sets]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdowns((previous) => {
        let changed = false;
        const next: Record<string, CountdownState> = { ...previous };

        Object.entries(previous).forEach(([key, state]) => {
          if (!state.isRunning) {
            return;
          }

          changed = true;
          const nextRemaining = Math.max(0, state.remainingSeconds - 1);
          next[key] = {
            ...state,
            remainingSeconds: nextRemaining,
            isRunning: nextRemaining > 0,
          };
        });

        return changed ? next : previous;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const availableSetIds = new Set(sets.map((set) => set.id));
    setCountdowns((previous) => {
      const next = { ...previous };
      let changed = false;

      Object.keys(next).forEach((key) => {
        const [setId] = key.split(":");
        const parsedSetId = Number.parseInt(setId, 10);
        if (!availableSetIds.has(parsedSetId)) {
          delete next[key];
          changed = true;
        }
      });

      return changed ? next : previous;
    });
  }, [sets]);

  const handleSaveSet = async (setId: number) => {
    if (savingSetId !== null) return;
    const latestSet = setsRef.current.find((item) => item.id === setId);
    if (!latestSet) return;

    setSavingSetId(setId);
    try {
      const savedValues = await onSaveSet({
        workoutExerciseId: id,
        setId: latestSet.persistedSetId,
        exerciseTypeValue: latestSet.exerciseTypeValue,
        weight: latestSet.weight,
        restTime: latestSet.restTime,
        isTimerType,
        hasWeight,
      });

      if (!savedValues) {
        onNotify(t("couldNotSaveSet"), "error");
        return;
      }

      setSets((previous) =>
        previous.map((item) =>
          item.id === setId
            ? {
                ...item,
                saved: true,
                persistedSetId: savedValues.setId,
                createdAt: savedValues.createdAt,
                savedExerciseTypeValue: savedValues.exerciseTypeValue,
                savedWeight: savedValues.weight,
                savedRestTime: savedValues.restTime,
                exerciseTypeValue: isTimerType
                  ? formatSeconds(savedValues.exerciseTypeValue)
                  : String(savedValues.exerciseTypeValue),
                weight:
                  savedValues.weight === null
                    ? ""
                    : savedValues.weight.toFixed(2),
                restTime: formatSeconds(savedValues.restTime),
                editingField: null,
              }
            : item,
        ),
      );
      clearCountdownForField(setId, "exerciseTypeValue");
      clearCountdownForField(setId, "restTime");
      onNotify(t("saved"), "success");
    } finally {
      setSavingSetId(null);
    }
  };

  const handleDeleteSet = async (setId: number) => {
    const targetSet = setsRef.current.find((item) => item.id === setId);
    if (!targetSet) return;

    setMenuSetId(null);

    if (!targetSet.saved) {
      setSets((previous) => previous.filter((item) => item.id !== setId));
      onNotify(t("setDeleted"), "success");
      return;
    }

    if (!targetSet.persistedSetId) {
      onNotify(t("couldNotDeleteSet"), "error");
      return;
    }

    const deleted = await onDeleteSet({
      workoutExerciseId: id,
      setId: targetSet.persistedSetId,
    });

    if (!deleted) {
      onNotify(t("couldNotDeleteSet"), "error");
      return;
    }

    setSets((previous) => previous.filter((item) => item.id !== setId));
    onNotify(t("setDeleted"), "success");
  };

  const startEditingField = (
    setId: number,
    field: "exerciseTypeValue" | "weight" | "restTime",
  ) => {
    setSets((previous) =>
      previous.map((set) => {
        if (set.id !== setId) {
          return { ...set, editingField: null };
        }

        return {
          ...set,
          editingField: field,
          exerciseTypeValue:
            field === "exerciseTypeValue" && set.savedExerciseTypeValue !== null
              ? isTimerType
                ? formatSeconds(set.savedExerciseTypeValue)
                : String(set.savedExerciseTypeValue)
              : set.exerciseTypeValue,
          weight:
            field === "weight" && set.savedWeight !== null
              ? set.savedWeight.toFixed(2)
              : set.weight,
          restTime:
            field === "restTime" && set.savedRestTime !== null
              ? formatSeconds(set.savedRestTime)
              : set.restTime,
        };
      }),
    );
  };

  const stopEditingField = (setId: number) => {
    setSets((previous) =>
      previous.map((set) =>
        set.id === setId
          ? {
              ...set,
              editingField: null,
            }
          : set,
      ),
    );
  };

  const handleDeleteExercise = async () => {
    setExerciseMenuOpen(false);
    const deleted = await onDeleteExercise(id);
    if (!deleted) {
      onNotify(t("couldNotDeleteExercise"), "error");
      return;
    }

    onNotify(t("exerciseDeleted"), "success");
  };

  const activeEditingSet =
    sets.find((set) => set.editingField !== null) ?? null;

  if (collapsed) {
    return (
      <View style={styles.container}>
        <View style={styles.exerciseHeaderRow}>
          <Pressable
            style={styles.headerPressArea}
            onPress={() => setCollapsed(false)}
          >
            <View style={styles.header}>
              <Text style={styles.name}>{name}</Text>
              <Text style={styles.chevron}>▼</Text>
            </View>
          </Pressable>
          <Pressable
            style={styles.exerciseMenuTrigger}
            onPress={() => setExerciseMenuOpen((previous) => !previous)}
          >
            <Text style={styles.menuTriggerText}>⋯</Text>
          </Pressable>
        </View>
        {notes ? <Text style={styles.notes}>{notes}</Text> : null}
        {exerciseMenuOpen ? (
          <View style={styles.exerciseMenuContainer}>
            <Pressable style={styles.menuItem} onPress={handleDeleteExercise}>
              <Text style={styles.menuItemDeleteText}>
                {t("deleteExercise")}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.exerciseHeaderRow}>
        <Pressable
          style={styles.headerPressArea}
          onPress={() => setCollapsed(true)}
        >
          <View style={styles.header}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.chevron}>▲</Text>
          </View>
        </Pressable>
        <Pressable
          style={styles.exerciseMenuTrigger}
          onPress={() => setExerciseMenuOpen((previous) => !previous)}
        >
          <Text style={styles.menuTriggerText}>⋯</Text>
        </Pressable>
      </View>
      {exerciseMenuOpen ? (
        <View style={styles.exerciseMenuContainer}>
          <Pressable style={styles.menuItem} onPress={handleDeleteExercise}>
            <Text style={styles.menuItemDeleteText}>{t("deleteExercise")}</Text>
          </Pressable>
        </View>
      ) : null}
      {notes ? <Text style={styles.notes}>{notes}</Text> : null}

      <View style={styles.content}>
        {loadingSets ? (
          <Text style={styles.meta}>{t("loadingSets")}</Text>
        ) : null}

        <Pressable style={styles.addSetButton} onPress={addSet}>
          <Text style={styles.addSetButtonText}>{t("addSet")}</Text>
        </Pressable>

        {sets.map((set, index) => (
          <View key={set.id} style={styles.setCard}>
            <View style={styles.setHeader}>
              <Text style={styles.setTitle}>
                {t("set")} {index + 1}
              </Text>
              <Pressable
                style={styles.menuTrigger}
                onPress={() =>
                  setMenuSetId((previous) =>
                    previous === set.id ? null : set.id,
                  )
                }
              >
                <Text style={styles.menuTriggerText}>⋯</Text>
              </Pressable>
            </View>
            {menuSetId === set.id ? (
              <View style={styles.menuContainer}>
                <Pressable
                  style={styles.menuItem}
                  onPress={() => handleDeleteSet(set.id)}
                >
                  <Text style={styles.menuItemDeleteText}>
                    {t("deleteSet")}
                  </Text>
                </Pressable>
              </View>
            ) : null}
            {set.saved ? (
              <View style={styles.savedRow}>
                <View>
                  <Pressable
                    onPress={() =>
                      startEditingField(set.id, "exerciseTypeValue")
                    }
                  >
                    <Text style={styles.savedValueText}>
                      {isTimerType
                        ? `${t("workTime")}: ${formatSeconds(set.savedExerciseTypeValue ?? 0)}`
                        : `${set.savedExerciseTypeValue ?? 0}x`}
                    </Text>
                  </Pressable>
                  {isTimerType
                    ? renderCountdownControls(set, "exerciseTypeValue")
                    : null}
                </View>

                {hasWeight ? (
                  <Pressable
                    onPress={() => startEditingField(set.id, "weight")}
                  >
                    <Text style={styles.savedValueText}>
                      {(set.savedWeight ?? 0).toFixed(2)} kg
                    </Text>
                  </Pressable>
                ) : null}

                <View>
                  <Pressable
                    onPress={() => startEditingField(set.id, "restTime")}
                  >
                    <Text style={styles.savedValueText}>
                      {t("rest")}: {formatSeconds(set.savedRestTime ?? 0)}
                    </Text>
                  </Pressable>
                  {renderCountdownControls(set, "restTime")}
                </View>
              </View>
            ) : (
              <>
                {isTimerType ? (
                  <View>
                    <Text style={styles.timeFieldLabel}>{t("workTime")}</Text>
                    {renderTimeInputs(set, "exerciseTypeValue")}
                    {renderCountdownControls(set, "exerciseTypeValue")}
                  </View>
                ) : (
                  <View style={styles.valueWithSuffixRow}>
                    <TextInput
                      style={styles.input}
                      value={set.exerciseTypeValue}
                      onChangeText={(value) =>
                        updateSet(set.id, "exerciseTypeValue", value)
                      }
                      placeholder="0"
                      keyboardType="numeric"
                    />
                    <Text style={styles.savedValueText}>x</Text>
                  </View>
                )}
                {hasWeight ? (
                  <TextInput
                    style={styles.input}
                    value={set.weight}
                    onChangeText={(value) => updateSet(set.id, "weight", value)}
                    placeholder="0.00 kg"
                    keyboardType="decimal-pad"
                  />
                ) : null}
                <View>
                  <Text style={styles.timeFieldLabel}>{t("restTime")}</Text>
                  {renderTimeInputs(set, "restTime")}
                  {renderCountdownControls(set, "restTime")}
                </View>
                <Pressable
                  style={styles.saveSetButton}
                  onPress={() => handleSaveSet(set.id)}
                  disabled={savingSetId === set.id}
                >
                  <Text style={styles.saveSetButtonText}>
                    {savingSetId === set.id ? t("saving") : t("saveSet")}
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        ))}
      </View>

      <Modal
        visible={activeEditingSet !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (activeEditingSet) {
            stopEditingField(activeEditingSet.id);
          }
        }}
      >
        <View style={styles.editModalBackdrop}>
          <View style={styles.editModalCard}>
            {activeEditingSet?.editingField === "exerciseTypeValue" ? (
              isTimerType ? (
                <>
                  <Text style={styles.editModalTitle}>{t("workTime")}</Text>
                  {renderTimeInputs(
                    activeEditingSet,
                    "exerciseTypeValue",
                    true,
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.editModalTitle}>Reps</Text>
                  <View style={styles.valueWithSuffixRow}>
                    <TextInput
                      style={[styles.input, styles.modalNumericInput]}
                      value={activeEditingSet.exerciseTypeValue}
                      onChangeText={(value) =>
                        updateSet(
                          activeEditingSet.id,
                          "exerciseTypeValue",
                          value,
                        )
                      }
                      autoFocus
                      keyboardType="numeric"
                    />
                    <Text style={styles.savedValueText}>x</Text>
                  </View>
                </>
              )
            ) : null}

            {activeEditingSet?.editingField === "weight" ? (
              <>
                <Text style={styles.editModalTitle}>Weight</Text>
                <View style={styles.valueWithSuffixRow}>
                  <TextInput
                    style={[styles.input, styles.modalNumericInput]}
                    value={activeEditingSet.weight}
                    onChangeText={(value) =>
                      updateSet(activeEditingSet.id, "weight", value)
                    }
                    autoFocus
                    keyboardType="decimal-pad"
                  />
                  <Text style={styles.savedValueText}>kg</Text>
                </View>
              </>
            ) : null}

            {activeEditingSet?.editingField === "restTime" ? (
              <>
                <Text style={styles.editModalTitle}>{t("restTime")}</Text>
                {renderTimeInputs(activeEditingSet, "restTime", true)}
              </>
            ) : null}

            <View style={styles.editModalActions}>
              <Pressable
                style={styles.editModalCancelButton}
                onPress={() => {
                  if (activeEditingSet) {
                    stopEditingField(activeEditingSet.id);
                  }
                }}
              >
                <Text style={styles.editModalCancelButtonText}>
                  {t("cancel")}
                </Text>
              </Pressable>
              <Pressable
                style={styles.editModalSaveButton}
                onPress={async () => {
                  if (!activeEditingSet) {
                    return;
                  }

                  await handleSaveSet(activeEditingSet.id);
                  stopEditingField(activeEditingSet.id);
                }}
              >
                <Text style={styles.editModalSaveButtonText}>
                  {t("saveSet")}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  exerciseHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  headerPressArea: {
    flex: 1,
  },
  exerciseMenuTrigger: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  exerciseMenuContainer: {
    position: "absolute",
    top: 34,
    right: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    zIndex: 30,
    elevation: 4,
  },
  chevron: {
    color: "#666",
  },
  content: {
    marginTop: 8,
  },
  meta: {
    fontSize: 14,
    marginBottom: 2,
  },
  notes: {
    fontSize: 14,
    marginTop: 4,
    color: "#555",
  },
  setCard: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#e6e6e6",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fafafa",
  },
  setTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  setHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuTrigger: {
    marginTop: -4,
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
    top: 28,
    right: 10,
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
  input: {
    borderWidth: 1,
    borderColor: "#d0d0d0",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 6,
  },
  addSetButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: "#efefef",
  },
  addSetButtonText: {
    fontWeight: "600",
  },
  saveSetButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#e9e9e9",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  saveSetButtonText: {
    fontWeight: "600",
  },
  savedRow: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  savedValueText: {
    fontSize: 13,
    flexShrink: 1,
    textDecorationLine: "underline",
  },
  savedInlineInput: {
    marginTop: 0,
    minWidth: 100,
    paddingVertical: 6,
  },
  timeInputRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timePartInput: {
    marginTop: 0,
    minWidth: 64,
    textAlign: "center",
  },
  timeSeparator: {
    fontSize: 16,
    fontWeight: "700",
    color: "#555",
  },
  timeFieldLabel: {
    marginTop: 6,
    fontSize: 12,
    color: "#555",
    fontWeight: "600",
  },
  savedTimeEditorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inlineSaveButton: {
    marginTop: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: "#efefef",
  },
  inlineSaveButtonText: {
    fontWeight: "600",
    fontSize: 12,
  },
  valueWithSuffixRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timerControlsRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  timerCountdownText: {
    fontSize: 12,
    fontWeight: "700",
    minWidth: 56,
  },
  timerControlButton: {
    backgroundColor: "#efefef",
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  timerControlButtonText: {
    fontSize: 11,
    fontWeight: "600",
  },
  timerControlButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  editModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  editModalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  modalNumericInput: {
    minWidth: 120,
  },
  editModalActions: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editModalCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  editModalCancelButtonText: {
    color: "#666",
    fontSize: 16,
  },
  editModalSaveButton: {
    backgroundColor: "#efefef",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  editModalSaveButtonText: {
    fontWeight: "600",
  },
});
