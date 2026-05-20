import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import Button from "../components/Button";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text>Hier gibts noch nix zu sehen c:</Text>
      <Button label="Press me" />
      <Link href="/options" style={styles.link}>
        Go to Options
      </Link>
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
});
