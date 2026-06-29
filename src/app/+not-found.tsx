import { Link, Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "../i18n/useTranslation";

export default function NotFoundScreen() {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ title: t("oopsNotFound") }} />
      <View style={styles.container}>
        <Link href="/" style={styles.button}>
          {t("goBackHome")}
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },

  button: {
    fontSize: 20,
    textDecorationLine: "underline",
    color: "#2563eb",
  },
});
