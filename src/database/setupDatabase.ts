import { SQLiteDatabase } from "expo-sqlite";

export async function createTablesAndDefaults(db: SQLiteDatabase) {
  console.log("Creating tables and inserting defaults...");
  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS exercise_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS workout_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      notes TEXT,
      workout_id INTEGER NOT NULL,
      type_id INTEGER NOT NULL,
      has_weight INTEGER NOT NULL DEFAULT 0 CHECK (has_weight IN (0, 1)),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME,
      FOREIGN KEY (workout_id) REFERENCES workouts(id),
      FOREIGN KEY (type_id) REFERENCES exercise_types(id)
    );

    CREATE TRIGGER IF NOT EXISTS workout_exercises_immutable_fields
    BEFORE UPDATE OF name, notes, workout_id, type_id, has_weight ON workout_exercises
    FOR EACH ROW
    BEGIN
      SELECT RAISE(ABORT, 'workout_exercises fields are immutable after creation');
    END;

    CREATE TABLE IF NOT EXISTS workout_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_id INTEGER NOT NULL,
      workout_begin_at DATETIME,
      workout_finished_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME,
      FOREIGN KEY (workout_id) REFERENCES workouts(id)
    );

    CREATE TABLE IF NOT EXISTS workout_session_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_session_id INTEGER NOT NULL,
      workout_exercise_id INTEGER NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME,
      FOREIGN KEY (workout_session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (workout_exercise_id) REFERENCES workout_exercises(id)
    );

    CREATE TABLE IF NOT EXISTS workout_session_exercise_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_session_exercise_id INTEGER NOT NULL,
      set_number INTEGER NOT NULL,
      exercise_type_value INTEGER NOT NULL,
      weight REAL,
      rest_time INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME,
      FOREIGN KEY (workout_session_exercise_id) REFERENCES workout_session_exercises(id) ON DELETE CASCADE,
      UNIQUE (workout_session_exercise_id, set_number)
    );
    
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      value TEXT,
      category_id INTEGER,
      setting_type_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS setting_categories (
      id INTEGER PRIMARY KEY UNIQUE,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS setting_types (
      id INTEGER PRIMARY KEY UNIQUE,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME
    );
  `);

  // Insert 'general' category if not exists
  const generalCat = await db.getFirstAsync(
    "SELECT id FROM setting_categories WHERE id = ?",
    [1],
  );
  let generalCatId = (generalCat as { id?: number })?.id;
  if (!generalCatId) {
    const result = await db.runAsync(
      "INSERT INTO setting_categories (id, name) VALUES (?, ?)",
      [1, "Allgemein"],
    );
    generalCatId = result.lastInsertRowId;
  }

  // Insert 'theme' setting if not exists
  const themeSetting = await db.getFirstAsync(
    "SELECT id FROM settings WHERE id = ?",
    [1],
  );
  if (!themeSetting) {
    await db.runAsync(
      "INSERT INTO settings (id, name, value, category_id, setting_type_id) VALUES (?, ?, ?, ?, ?)",
      [1, "Theme", "0", generalCatId, 4],
    );
  }

  const languageSetting = await db.getFirstAsync(
    "SELECT id FROM settings WHERE id = ?",
    [3],
  );
  if (!languageSetting) {
    await db.runAsync(
      "INSERT INTO settings (id, name, value, category_id, setting_type_id) VALUES (?, ?, ?, ?, ?)",
      [3, "Language", "de", generalCatId, 6],
    );
  }

  // Insert 'layout' category if not exists
  const layoutCat = await db.getFirstAsync(
    "SELECT id FROM setting_categories WHERE id = ?",
    [2],
  );
  let layoutCatId = (layoutCat as { id?: number })?.id;
  if (!layoutCatId) {
    const result = await db.runAsync(
      "INSERT INTO setting_categories (id, name) VALUES (?, ?)",
      [2, "Layout"],
    );
    layoutCatId = result.lastInsertRowId;
  }

  // Insert 'primary_color' setting if not exists
  const colorSetting = await db.getFirstAsync(
    "SELECT id FROM settings WHERE id = ?",
    [2],
  );
  if (!colorSetting) {
    await db.runAsync(
      "INSERT INTO settings (id, name, value, category_id, setting_type_id) VALUES (?, ?, ?, ?, ?)",
      [2, "Hauptfarbe", "#813dffff", layoutCatId, 5],
    );
  }

  // Insert 'input' type if not exists
  const inputType = await db.getFirstAsync(
    "SELECT id FROM setting_types WHERE id = ?",
    [1],
  );
  if (!inputType) {
    await db.runAsync("INSERT INTO setting_types (id, name) VALUES (?, ?)", [
      1,
      "input",
    ]);
  }

  // Insert 'text' type if not exists
  const textType = await db.getFirstAsync(
    "SELECT id FROM setting_types WHERE id = ?",
    [2],
  );
  if (!textType) {
    await db.runAsync("INSERT INTO setting_types (id, name) VALUES (?, ?)", [
      2,
      "text",
    ]);
  }

  // Insert 'number' type if not exists
  const numberType = await db.getFirstAsync(
    "SELECT id FROM setting_types WHERE id = ?",
    [3],
  );
  if (!numberType) {
    await db.runAsync("INSERT INTO setting_types (id, name) VALUES (?, ?)", [
      3,
      "number",
    ]);
  }

  // Insert 'boolean' type if not exists
  const booleanType = await db.getFirstAsync(
    "SELECT id FROM setting_types WHERE id = ?",
    [4],
  );
  if (!booleanType) {
    await db.runAsync("INSERT INTO setting_types (id, name) VALUES (?, ?)", [
      4,
      "boolean",
    ]);
  }

  // Insert 'color' type if not exists
  const colorType = await db.getFirstAsync(
    "SELECT id FROM setting_types WHERE id = ?",
    [5],
  );
  if (!colorType) {
    await db.runAsync("INSERT INTO setting_types (id, name) VALUES (?, ?)", [
      5,
      "color",
    ]);
  }

  // Insert 'select' type if not exists
  const selectType = await db.getFirstAsync(
    "SELECT id FROM setting_types WHERE id = ?",
    [6],
  );
  if (!selectType) {
    await db.runAsync("INSERT INTO setting_types (id, name) VALUES (?, ?)", [
      6,
      "select",
    ]);
  }

  const repeatsExerciseType = await db.getFirstAsync(
    "SELECT id FROM exercise_types WHERE name = ?",
    ["repeats"],
  );
  if (!repeatsExerciseType) {
    await db.runAsync("INSERT INTO exercise_types (name) VALUES (?)", [
      "repeats",
    ]);
  }

  const timerExerciseType = await db.getFirstAsync(
    "SELECT id FROM exercise_types WHERE name = ?",
    ["timer"],
  );
  if (!timerExerciseType) {
    await db.runAsync("INSERT INTO exercise_types (name) VALUES (?)", [
      "timer",
    ]);
  }

  console.log("Database setup complete.");
}

export async function dropAndCreateTables(db: SQLiteDatabase) {
  console.log("Dropping all tables and recreating...");
  await db.execAsync(`
    DROP TABLE IF EXISTS workout_session_exercise_sets;
    DROP TABLE IF EXISTS workout_session_exercises;
    DROP TABLE IF EXISTS workout_sessions;
    DROP TABLE IF EXISTS workout_exercises;
    DROP TABLE IF EXISTS exercise_types;
    DROP TABLE IF EXISTS workouts;
    DROP TABLE IF EXISTS settings;
    DROP TABLE IF EXISTS setting_categories;
    DROP TABLE IF EXISTS setting_types;
  `);
  await createTablesAndDefaults(db);
}

// For backward compatibility
export const setupDatabase = createTablesAndDefaults;
