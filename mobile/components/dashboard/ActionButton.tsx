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
      activeOpacity={0.86}
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
      <Text style={styles.text} numberOfLines={1}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    minWidth: 118,
    borderRadius: 18,
    paddingVertical: 13,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#171b27",
    borderWidth: 1,
    borderColor: "#2d3342",
  },
  success: {
    backgroundColor: "#14532d",
    borderColor: "#22c55e",
  },
  danger: {
    backgroundColor: "#581c1c",
    borderColor: "#ef4444",
  },
  warning: {
    backgroundColor: "#78350f",
    borderColor: "#f59e0b",
  },
  disabled: {
    opacity: 0.55,
  },
  text: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.35,
    textTransform: "uppercase",
  },
});
