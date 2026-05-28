import { useSQLiteContext } from "expo-sqlite";
import { Alert, StyleSheet, View } from "react-native";
import Button from "../components/Button";

export default function Options() {
  const database = useSQLiteContext();

  const handleDeleteAll = async () => {
    try {
      await database.runAsync("DELETE FROM workouts;");
      Alert.alert("Success", "All data deleted.");
    } catch (error) {
      Alert.alert("Error", "Failed to delete data.");
    }
  };

  return (
    <View style={styles.container}>
      <Button label="Delete All Data" action={handleDeleteAll} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
