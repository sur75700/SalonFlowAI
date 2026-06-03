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
      activeOpacity={0.82}
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
      <Text style={styles.text} numberOfLines={2} adjustsFontSizeToFit>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    minWidth: 104,
    borderRadius: UI.radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 12,
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
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    textAlign: "center",
    lineHeight: 17,
  },
});
