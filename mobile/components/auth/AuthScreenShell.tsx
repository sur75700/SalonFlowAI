import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { useAppLanguage } from "../../contexts/LanguageContext";
import { useDashboardTheme } from "../../hooks/useDashboardTheme";
import RoyalCosmosBackground from "../ui/RoyalCosmosBackground";
import SalonFlowBrandMark from "../brand/SalonFlowBrandMark";
import AccessLanguageSwitcher from "./AccessLanguageSwitcher";
import { accessGatewayCopy } from "./access-gateway-copy";

type AuthScreenShellProps = {
  eyebrow?: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export default function AuthScreenShell({
  eyebrow,
  title,
  subtitle,
  children,
}: AuthScreenShellProps) {
  const { width } = useWindowDimensions();
  const { language } = useAppLanguage();
  const { selectedThemeId, theme } = useDashboardTheme();
  const copy = accessGatewayCopy(language);
  const desktop = width >= 960;
  const accent =
    selectedThemeId === "royal_gold_cosmos"
      ? theme.palette.gold
      : theme.palette.royal;
  const accentSoft =
    selectedThemeId === "royal_gold_cosmos"
      ? theme.palette.goldGlow
      : theme.palette.royalGlow;
  const themeLabel =
    selectedThemeId === "royal_gold_cosmos"
      ? "Royal Gold Cosmos"
      : "Royal Cosmos";

  const highlights = [
    { icon: "key-outline" as const, label: copy.sessionContinuity },
    { icon: "language-outline" as const, label: copy.fourLanguages },
    { icon: "sparkles-outline" as const, label: copy.themeAware },
  ];

  return (
    <RoyalCosmosBackground style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: desktop ? 32 : 16,
              paddingVertical: desktop ? 30 : 18,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.frame,
              desktop ? styles.frameDesktop : styles.frameMobile,
              {
                backgroundColor: theme.palette.surface,
                borderColor: theme.palette.borderStrong,
                boxShadow: `0 24px 80px ${accentSoft}`,
              },
            ]}
          >
            <View
              style={[
                styles.brandPanel,
                desktop ? styles.brandPanelDesktop : styles.brandPanelMobile,
                {
                  backgroundColor: theme.palette.surface,
                  borderColor: theme.palette.border,
                },
              ]}
            >
              <View style={styles.brandTopRow}>
                <SalonFlowBrandMark size={64} />

                <View
                  style={[
                    styles.themePill,
                    {
                      borderColor: theme.palette.borderStrong,
                      backgroundColor: theme.palette.surfaceRaised,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.themeDot,
                      { backgroundColor: accent },
                    ]}
                  />
                  <Text
                    style={[
                      styles.themePillText,
                      { color: theme.palette.textSecondary },
                    ]}
                  >
                    {themeLabel}
                  </Text>
                </View>
              </View>

              <View style={styles.heroCopy}>
                <Text
                  style={[
                    styles.eyebrow,
                    { color: accent },
                  ]}
                >
                  {eyebrow || copy.overline}
                </Text>

                <Text
                  style={[
                    styles.title,
                    {
                      color: theme.palette.textPrimary,
                      fontSize: desktop ? 42 : 32,
                      lineHeight: desktop ? 47 : 37,
                    },
                  ]}
                >
                  {title}
                </Text>

                <Text
                  style={[
                    styles.subtitle,
                    { color: theme.palette.textSecondary },
                  ]}
                >
                  {subtitle}
                </Text>
              </View>

              <View style={styles.highlights}>
                {highlights.map((item) => (
                  <View
                    key={item.label}
                    style={styles.highlightRow}
                  >
                    <View
                      style={[
                        styles.highlightIcon,
                        {
                          backgroundColor: accentSoft,
                        },
                      ]}
                    >
                      <Ionicons
                        name={item.icon}
                        size={16}
                        color={accent}
                      />
                    </View>

                    <Text
                      style={[
                        styles.highlightText,
                        { color: theme.palette.textSecondary },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>

              <View
                style={[
                  styles.languageArea,
                  { borderTopColor: theme.palette.border },
                ]}
              >
                <AccessLanguageSwitcher />
              </View>
            </View>

            <View
              style={[
                styles.formPanel,
                desktop ? styles.formPanelDesktop : styles.formPanelMobile,
                {
                  backgroundColor: theme.palette.surfaceRaised,
                  borderColor: theme.palette.border,
                },
              ]}
            >
              {children}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </RoyalCosmosBackground>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  frame: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
    borderWidth: 1,
    borderRadius: 30,
    overflow: "hidden",
  },
  frameDesktop: {
    minHeight: 650,
    flexDirection: "row",
  },
  frameMobile: {
    flexDirection: "column",
  },
  brandPanel: {
    borderColor: "transparent",
  },
  brandPanelDesktop: {
    width: "42%",
    padding: 34,
    justifyContent: "space-between",
  },
  brandPanelMobile: {
    padding: 22,
    gap: 24,
  },
  brandTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  themePill: {
    minHeight: 32,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  themeDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  themePillText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  heroCopy: {
    gap: 12,
    maxWidth: 470,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
  },
  title: {
    fontWeight: "900",
    letterSpacing: -1.1,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "600",
    maxWidth: 440,
  },
  highlights: {
    gap: 10,
  },
  highlightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  highlightIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  highlightText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
  },
  languageArea: {
    borderTopWidth: 1,
    paddingTop: 18,
  },
  formPanel: {
    flex: 1,
    borderColor: "transparent",
  },
  formPanelDesktop: {
    padding: 34,
    justifyContent: "center",
    borderLeftWidth: 1,
  },
  formPanelMobile: {
    padding: 20,
    borderTopWidth: 1,
  },
});
