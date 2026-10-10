import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useDashboardTheme } from "../../hooks/useDashboardTheme";

export const SERVICE_ICON_OPTIONS = [
  { key: "", icon: "sparkles-outline", label: "Auto" },
  { key: "haircut", icon: "cut-outline", label: "Haircut" },
  { key: "styling", icon: "brush-outline", label: "Styling" },
  { key: "color", icon: "color-palette-outline", label: "Color" },
  { key: "makeup", icon: "color-wand-outline", label: "Makeup" },
  { key: "nails", icon: "hand-left-outline", label: "Nails" },
  { key: "brows", icon: "eye-outline", label: "Brows" },
  { key: "facial", icon: "sparkles-outline", label: "Facial" },
  { key: "spa", icon: "leaf-outline", label: "Spa" },
  { key: "massage", icon: "body-outline", label: "Massage" },
  { key: "bridal", icon: "diamond-outline", label: "Bridal" },
  { key: "waxing", icon: "flame-outline", label: "Waxing" },
  { key: "laser", icon: "flash-outline", label: "Laser" },
  { key: "barber", icon: "person-outline", label: "Barber" },
  { key: "wellness", icon: "heart-outline", label: "Wellness" },
  { key: "premium", icon: "diamond-outline", label: "Premium" },
  { key: "kids", icon: "happy-outline", label: "Kids" },
  { key: "body", icon: "body-outline", label: "Body" },
  { key: "skincare", icon: "water-outline", label: "Skincare" },
] as const;

export type ServiceIconKey =
  (typeof SERVICE_ICON_OPTIONS)[number]["key"];

export function resolveServiceIconName(
  iconKey: string | null | undefined
): React.ComponentProps<typeof Ionicons>["name"] | null {
  const option = SERVICE_ICON_OPTIONS.find(
    (item) => item.key === (iconKey || "")
  );

  return option?.key ? option.icon : null;
}

export default function ServiceIconPickerV2({
  value,
  disabled = false,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  onChange: (value: ServiceIconKey) => void;
}) {
  const { selectedThemeId, theme } = useDashboardTheme();
  const accent =
    selectedThemeId === "royal_gold_cosmos"
      ? theme.palette.gold
      : theme.palette.royal;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text
          style={[
            styles.eyebrow,
            { color: theme.palette.textTertiary },
          ]}
        >
          SERVICE ICON
        </Text>
        <Text
          style={[
            styles.helper,
            { color: theme.palette.textSecondary },
          ]}
        >
          Choose the symbol clients will recognize.
        </Text>
      </View>

      <View style={styles.grid}>
        {SERVICE_ICON_OPTIONS.map((option) => {
          const selected = value === option.key;

          return (
            <Pressable
              key={option.key || "auto"}
              accessibilityRole="button"
              accessibilityLabel={`Service icon: ${option.label}`}
              accessibilityState={{ selected, disabled }}
              disabled={disabled}
              onPress={() => onChange(option.key)}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: selected
                    ? theme.palette.surfaceRaised
                    : theme.palette.surface,
                  borderColor: selected
                    ? accent
                    : theme.palette.border,
                  shadowColor: selected ? accent : "#000000",
                },
                selected && styles.optionSelected,
                pressed && !disabled && styles.optionPressed,
                disabled && styles.optionDisabled,
              ]}
            >
              <View
                style={[
                  styles.iconShell,
                  {
                    borderColor: selected
                      ? `${accent}88`
                      : theme.palette.border,
                    backgroundColor: selected
                      ? theme.palette.royalGlow
                      : theme.palette.surfaceRaised,
                  },
                ]}
              >
                <Ionicons
                  name={option.icon}
                  size={21}
                  color={
                    selected
                      ? accent
                      : theme.palette.textSecondary
                  }
                />
              </View>

              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  {
                    color: selected
                      ? theme.palette.textPrimary
                      : theme.palette.textSecondary,
                  },
                ]}
              >
                {option.label}
              </Text>

              {selected ? (
                <View
                  pointerEvents="none"
                  style={[
                    styles.selectedDot,
                    { backgroundColor: accent },
                  ]}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginTop: 2,
    marginBottom: 4,
    gap: 10,
  },
  header: {
    gap: 2,
  },
  eyebrow: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  helper: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
  option: {
    position: "relative",
    width: 88,
    minHeight: 82,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    shadowOpacity: 0,
    shadowRadius: 13,
    shadowOffset: { width: 0, height: 6 },
  },
  optionSelected: {
    shadowOpacity: 0.24,
  },
  optionPressed: {
    transform: [{ scale: 0.97 }],
  },
  optionDisabled: {
    opacity: 0.5,
  },
  iconShell: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    maxWidth: "100%",
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "800",
  },
  selectedDot: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 6,
    height: 6,
    borderRadius: 999,
  },
});
