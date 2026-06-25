import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  label: string;
};

const openWorkout = () => {
  // Placeholder for workout click action
  console.log("Workout clicked");
};

export default function Workout({ label }: Props) {
  return (
    <View style={styles.workoutContainer}>
      <Pressable style={styles.workout} onPress={openWorkout}>
        <Text style={styles.workoutText}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  workoutContainer: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#000",
    borderStyle: "solid",
    padding: 25,
    borderRadius: 5,
    width: "80%",
  },
  workout: {
    alignItems: "center",
  },
  workoutText: {
    fontSize: 20,
    color: "#000",
  },
});
