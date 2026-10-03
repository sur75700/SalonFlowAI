import React, { useEffect } from "react";
import { Asset } from "expo-asset";
import { Image, ImageStyle, Platform, StyleProp, StyleSheet } from "react-native";

import { useDashboardTheme } from "../../hooks/useDashboardTheme";

export type SalonFlowBrandVariant =
  | "auto"
  | "royal-cosmos"
  | "royal-gold"
  | "burgundy";

type SalonFlowBrandMarkProps = {
  size?: number;
  variant?: SalonFlowBrandVariant;
  style?: StyleProp<ImageStyle>;
};

const ASSETS = {
  "royal-cosmos": require("../../assets/brand/salonflowai-royal-cosmos-ui.png"),
  "royal-gold": require("../../assets/brand/salonflowai-royal-gold-ui.png"),
  burgundy: require("../../assets/brand/salonflowai-burgundy-ui.png"),
} as const;

export function SalonFlowWebBrandSync() {
  const { selectedThemeId } = useDashboardTheme();

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;

    const source =
      selectedThemeId === "royal_gold_cosmos"
        ? ASSETS["royal-gold"]
        : ASSETS["royal-cosmos"];
    const uri = Asset.fromModule(source).uri;
    if (!uri) return;

    document
      .querySelectorAll<HTMLLinkElement>('link[rel*="icon"]')
      .forEach((node) => node.remove());

    const favicon = document.createElement("link");
    favicon.rel = "icon";
    favicon.type = "image/png";
    favicon.href = uri;
    document.head.appendChild(favicon);

    const shortcut = document.createElement("link");
    shortcut.rel = "shortcut icon";
    shortcut.type = "image/png";
    shortcut.href = uri;
    document.head.appendChild(shortcut);
  }, [selectedThemeId]);

  return null;
}

export default function SalonFlowBrandMark({
  size = 64,
  variant = "auto",
  style,
}: SalonFlowBrandMarkProps) {
  const { selectedThemeId } = useDashboardTheme();

  const resolvedVariant =
    variant === "auto"
      ? selectedThemeId === "royal_gold_cosmos"
        ? "royal-gold"
        : "royal-cosmos"
      : variant;

  return (
    <Image
      accessibilityIgnoresInvertColors
      accessibilityLabel="SalonFlowAI"
      resizeMode="contain"
      source={ASSETS[resolvedVariant]}
      style={[
        styles.mark,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.22),
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  mark: { flexShrink: 0 },
});
