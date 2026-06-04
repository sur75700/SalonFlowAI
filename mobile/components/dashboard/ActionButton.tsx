import React from "react";
import { UI } from "../../lib/theme/tokens";
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from "react-native";

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: "default" | "success" | "danger" | "warning";
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function ActionButton({
  title,
  onPress,
  disabled = false,
  tone = "default",
  compact = false,
  style,
}: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={[
        styles.button,
        compact && styles.compact,
        tone === "success" && styles.success,
        tone === "danger" && styles.danger,
        tone === "warning" && styles.warning,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[styles.text, compact && styles.compactText]}
        numberOfLines={2}
        adjustsFontSizeToFit
      >
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
  compact: {
    flex: 0,
    minWidth: 0,
    minHeight: 52,
    paddingVertical: 10,
    paddingHorizontal: 10,
    elevation: 6,
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
  compactText: {
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: 0.5,
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
