import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  message: string | null;
  type?: "success" | "error";
  duration?: number;
  onHide?: () => void;
};

export default function Notification({
  message,
  type = "success",
  duration = 3000,
  onHide,
}: Props) {
  const [visible, setVisible] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!message) {
      setVisible(false);
      return;
    }

    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      onHide?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, message, onHide]);

  if (!message || !visible) {
    return null;
  }

  return (
    <View pointerEvents="none" style={[styles.container, { top: -insets.top }]}>
      <View
        style={[
          styles.toast,
          type === "success" ? styles.toastSuccess : styles.toastError,
        ]}
      >
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    alignItems: "stretch",
    zIndex: 1000,
  },
  toast: {
    borderRadius: 0,
    paddingVertical: 10,
    paddingHorizontal: 16,
    width: "100%",
  },
  toastSuccess: {
    backgroundColor: "#2e7d32",
  },
  toastError: {
    backgroundColor: "#c62828",
  },
  text: {
    color: "#fff",
    fontSize: 13,
    textAlign: "center",
  },
});
