import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { createTablesAndDefaults } from "../database/setupDatabase";

export default function RootLayout() {
  const createDbIfNeeded = createTablesAndDefaults;

  return (
    <SQLiteProvider databaseName="timervall.db" onInit={createDbIfNeeded}>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: "#fff" },
          headerStyle: { backgroundColor: "#fff" },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </SQLiteProvider>
  );
}
