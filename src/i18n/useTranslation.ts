import { useFocusEffect } from "@react-navigation/native";
import { useSQLiteContext, type SQLiteDatabase } from "expo-sqlite";
import { useCallback, useEffect, useState } from "react";

export type AppLanguage = "de" | "en";

type TranslationDictionary = Record<string, string>;

const translations: Record<AppLanguage, TranslationDictionary> = {
  de: {
    tabWorkouts: "Workouts",
    tabOptions: "Optionen",
    addWorkout: "Workout hinzufügen",
    addWorkoutTitle: "Workout hinzufügen",
    workoutNamePlaceholder: "Workout-Name",
    saveWorkout: "Workout speichern",
    adding: "Wird hinzugefügt...",
    cancel: "Abbrechen",
    deleteAllData: "Alle Daten löschen",
    resetSuccessTitle: "Erfolg",
    resetSuccessMessage: "Alle Daten und Einstellungen wurden zurückgesetzt.",
    errorTitle: "Fehler",
    resetFailedPrefix: "Zurücksetzen fehlgeschlagen",
    loadingWorkoutDetails: "Workout-Details werden geladen...",
    exercisesCount: "Übungen gesamt",
    completedSessions: "Abgeschlossene Einheiten",
    completedSessionSingular: "Abgeschlossene Session",
    completedSessionPlural: "Abgeschlossene Einheiten",
    exerciseSingular: "Übung",
    exercisePlural: "Übungen",
    addExercise: "Übung hinzufügen",
    addExerciseTitle: "Übung hinzufügen",
    exerciseNamePlaceholder: "Übungsname",
    notesPlaceholder: "Notizen",
    containsWeights: "Gewicht enthalten",
    type: "Typ",
    selectType: "Typ auswählen",
    saveExercise: "Übung speichern",
    exerciseList: "Übungsliste",
    noExercises: "Noch keine Übungen.",
    loadingSets: "Sätze werden geladen...",
    addSet: "+ Satz hinzufügen",
    saveSet: "Satz speichern",
    saving: "Speichern...",
    set: "Satz",
    deleteSet: "Satz löschen",
    deleteExercise: "Übung löschen",
    deleteWorkout: "Workout löschen",
    setDeleted: "Satz gelöscht",
    workoutDeleted: "Workout gelöscht",
    couldNotDeleteSet: "Satz konnte nicht gelöscht werden",
    couldNotDeleteWorkout: "Workout konnte nicht gelöscht werden",
    exerciseDeleted: "Übung gelöscht",
    couldNotDeleteExercise: "Übung konnte nicht gelöscht werden",
    saved: "Gespeichert",
    couldNotSaveSet: "Satz konnte nicht gespeichert werden",
    workTime: "Arbeitszeit",
    reps: "Wiederholungen",
    weight: "Gewicht",
    restTime: "Pause",
    rest: "Pause",
    optionsTitle: "Optionen",
    language: "Sprache",
    languageGerman: "Deutsch",
    languageEnglish: "Englisch",
    oopsNotFound: "Ups! Nicht gefunden",
    goBackHome: "Zurück zum Startbildschirm",
  },
  en: {
    tabWorkouts: "Workouts",
    tabOptions: "Options",
    addWorkout: "Add Workout",
    addWorkoutTitle: "Add Workout",
    workoutNamePlaceholder: "Workout name",
    saveWorkout: "Save Workout",
    adding: "Adding...",
    cancel: "Cancel",
    deleteAllData: "Delete All Data",
    resetSuccessTitle: "Success",
    resetSuccessMessage: "All data and settings reset to default.",
    errorTitle: "Error",
    resetFailedPrefix: "Failed to reset data",
    loadingWorkoutDetails: "Loading workout details...",
    exercisesCount: "Exercises total",
    completedSessions: "Completed sessions",
    completedSessionSingular: "Completed session",
    completedSessionPlural: "Completed sessions",
    exerciseSingular: "Exercise",
    exercisePlural: "Exercises",
    addExercise: "Add Exercise",
    addExerciseTitle: "Add Exercise",
    exerciseNamePlaceholder: "Exercise name",
    notesPlaceholder: "Notes",
    containsWeights: "Contains weights",
    type: "Type",
    selectType: "Select type",
    saveExercise: "Save Exercise",
    exerciseList: "Exercise List",
    noExercises: "No exercises yet.",
    loadingSets: "Loading sets...",
    addSet: "+ Add Set",
    saveSet: "Save Set",
    saving: "Saving...",
    set: "Set",
    deleteSet: "Delete set",
    deleteExercise: "Delete exercise",
    deleteWorkout: "Delete workout",
    setDeleted: "Set deleted",
    workoutDeleted: "Workout deleted",
    couldNotDeleteSet: "Could not delete set",
    couldNotDeleteWorkout: "Could not delete workout",
    exerciseDeleted: "Exercise deleted",
    couldNotDeleteExercise: "Could not delete exercise",
    saved: "Saved",
    couldNotSaveSet: "Could not save set",
    workTime: "Work time",
    reps: "Reps",
    weight: "Weight",
    restTime: "Rest time",
    rest: "Rest",
    optionsTitle: "Options",
    language: "Language",
    languageGerman: "German",
    languageEnglish: "English",
    oopsNotFound: "Oops! Not Found",
    goBackHome: "Go back to Home screen",
  },
};

async function readLanguageFromDb(db: SQLiteDatabase): Promise<AppLanguage> {
  const result = (await db.getFirstAsync(
    "SELECT value FROM settings WHERE name = ? LIMIT 1;",
    ["Language"],
  )) as { value?: string } | null;

  const value = result?.value;
  if (value === "de" || value === "en") {
    return value;
  }

  return "de";
}

export function useTranslation() {
  const db = useSQLiteContext();
  const [language, setLanguage] = useState<AppLanguage>("de");

  const refreshLanguage = useCallback(async () => {
    try {
      const nextLanguage = await readLanguageFromDb(db);
      setLanguage(nextLanguage);
    } catch (error) {
      console.error("Error loading language:", error);
      setLanguage("de");
    }
  }, [db]);

  useEffect(() => {
    refreshLanguage();
  }, [refreshLanguage]);

  useFocusEffect(
    useCallback(() => {
      refreshLanguage();
    }, [refreshLanguage]),
  );

  const t = useCallback(
    (key: string) => {
      return translations[language][key] ?? key;
    },
    [language],
  );

  return {
    language,
    t,
    refreshLanguage,
  };
}

export async function updateLanguageSetting(
  db: SQLiteDatabase,
  language: AppLanguage,
) {
  await db.runAsync(
    "UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE name = ?;",
    [language, "Language"],
  );
}
