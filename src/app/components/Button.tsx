import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  label: string;
  action: () => void;
};

export default function Button({ label, action }: Props) {
  return (
    <View style={styles.buttonContainer}>
      <Pressable style={styles.button} onPress={action}>
        <Text style={styles.buttonText}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#000",
    borderStyle: "solid",
    padding: 10,
    borderRadius: 5,
  },
  button: {
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    color: "#000",
  },
});
