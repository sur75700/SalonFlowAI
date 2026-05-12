import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

type Props = {
  label: string;
  active?: boolean;
  onPress: () => void;
};

export default function FilterChip({
  label,
  active = false,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.base, active && styles.active]}
    >
      <Text style={[styles.text, active && styles.activeText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#11131a",
    borderWidth: 1,
    borderColor: "#332a38",
  },
  active: {
    backgroundColor: "#f2d17a",
    borderColor: "#f2d17a",
  },
  text: {
    color: "#d2c5d8",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  activeText: {
    color: "#111111",
  },
});
