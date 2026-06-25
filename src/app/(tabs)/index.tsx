import { useFocusEffect } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";
import React, { useEffect, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import Button from "../components/Button";
import Workout from "../components/Workout";

export default function Index() {
  const database = useSQLiteContext();
  const [workouts, setWorkouts] = useState<{ id: number; name: string }[]>([]);
  const [text, setText] = useState("");

  const onChangeText = (newText: string) => {
    setText(newText);
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchWorkouts();
    }, []),
  );

  const handleAddWorkout = async () => {
    try {
      await database.runAsync("INSERT INTO workouts (name) VALUES (?);", [
        text,
      ]);
      setText(""); // Clear input after adding
      fetchWorkouts(); // Refresh list after adding
    } catch (error) {
      console.error("Error adding workout:", error);
    }
  };

  const fetchWorkouts = async () => {
    try {
      const result: { id: number; name: string }[] = await database.getAllAsync(
        "SELECT * FROM workouts;",
      );
      setWorkouts(result);
    } catch (error) {
      console.error("Error fetching workouts:", error);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  return (
    <View style={styles.container}>
      {workouts.map((workout) => (
        <Workout key={workout.id} label={workout.name} />
      ))}
      <TextInput
        style={styles.input}
        onChangeText={onChangeText}
        value={text}
      />
      <Button label="Add Workout" action={handleAddWorkout} />
      {/* <Link href="/options" style={styles.link}>
        Go to Options
      </Link> */}
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
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginTop: 20,
    paddingHorizontal: 10,
    width: "80%",
  },
});
