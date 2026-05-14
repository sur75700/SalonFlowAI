import React from "react";
import { UI } from "../../lib/theme/tokens";
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
      activeOpacity={0.88}
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
    borderRadius: UI.radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#171b27",
    borderWidth: 1,
    boxShadow: UI.depth.card,
    elevation: 14,
    borderColor: "#4b556d",
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
    fontSize: UI.font.body,
    fontWeight: "900",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
});
