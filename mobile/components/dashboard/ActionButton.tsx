import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: "default" | "success" | "danger" | "warning";
};

export default function ActionButton({
  title,
  onPress,
  disabled = false,
  tone = "default",
}: Props) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        tone === "success" && styles.success,
        tone === "danger" && styles.danger,
        tone === "warning" && styles.warning,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    minWidth: 110,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#1b2130",
  },
  success: {
    backgroundColor: "#15803d",
  },
  danger: {
    backgroundColor: "#7f1d1d",
  },
  warning: {
    backgroundColor: "#b91c1c",
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
});
