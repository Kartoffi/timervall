import { StyleSheet, Text, View } from "react-native";

export default function Options() {
  return (
    <View style={styles.container}>
      <Text>Options :)</Text>
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
