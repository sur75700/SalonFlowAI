import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useDashboardTheme } from "../../hooks/useDashboardTheme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];
type AutoComplete = React.ComponentProps<typeof TextInput>["autoComplete"];
type KeyboardType = React.ComponentProps<typeof TextInput>["keyboardType"];
type TextContentType = React.ComponentProps<typeof TextInput>["textContentType"];

type ProviderBrand = "google" | "apple";

const GOOGLE_G = require("../../assets/auth-providers/google-g.png");

type AccessFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  icon: IconName;
  secure?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoComplete?: AutoComplete;
  keyboardType?: KeyboardType;
  textContentType?: TextContentType;
  editable?: boolean;
};

export function AccessField({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  secure = false,
  autoCapitalize = "none",
  autoComplete,
  keyboardType = "default",
  textContentType,
  editable = true,
}: AccessFieldProps) {
  const { selectedThemeId, theme } = useDashboardTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const accent =
    selectedThemeId === "royal_gold_cosmos"
      ? theme.palette.gold
      : theme.palette.royal;
  const accentSoft =
    selectedThemeId === "royal_gold_cosmos"
      ? theme.palette.goldGlow
      : theme.palette.royalGlow;

  return (
    <View style={styles.fieldBlock}>
      <Text
        style={[
          styles.fieldLabel,
          { color: theme.palette.textSecondary },
        ]}
      >
        {label}
      </Text>

      <View
        style={[
          styles.fieldFrame,
          {
            backgroundColor: theme.palette.surfaceRaised,
            borderColor: focused ? accent : theme.palette.border,
            boxShadow: focused
              ? `0 0 0 3px ${accentSoft}`
              : "none",
          },
        ]}
      >
        <View
          style={[
            styles.fieldIcon,
            { backgroundColor: accentSoft },
          ]}
        >
          <Ionicons
            name={icon}
            size={18}
            color={accent}
          />
        </View>

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.palette.textTertiary}
          secureTextEntry={secure && !revealed}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          autoComplete={autoComplete}
          keyboardType={keyboardType}
          textContentType={textContentType}
          editable={editable}
          selectionColor={accent}
          cursorColor={accent}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.input,
            {
              color: theme.palette.textPrimary,
            },
            Platform.OS === "web"
              ? ({
                  outlineStyle: "none",
                  boxShadow: `0 0 0 1000px ${theme.palette.surfaceRaised} inset`,
                } as any)
              : null,
          ]}
        />

        {secure ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? "Hide password" : "Show password"}
            onPress={() => setRevealed((value) => !value)}
            style={({ pressed }) => [
              styles.revealButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Ionicons
              name={revealed ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={theme.palette.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

type GatewayButtonProps = {
  label: string;
  icon?: IconName;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary";
};

export function GatewayButton({
  label,
  icon,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
}: GatewayButtonProps) {
  const { selectedThemeId, theme } = useDashboardTheme();

  const accent =
    selectedThemeId === "royal_gold_cosmos"
      ? theme.palette.gold
      : theme.palette.royal;
  const isGold = selectedThemeId === "royal_gold_cosmos";
  const primaryText = isGold ? "#17120A" : "#FFFFFF";

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor:
            variant === "primary"
              ? accent
              : theme.palette.surfaceRaised,
          borderColor:
            variant === "primary"
              ? accent
              : theme.palette.borderStrong,
          opacity:
            disabled || loading
              ? 0.48
              : pressed
                ? 0.82
                : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? primaryText : accent}
        />
      ) : icon ? (
        <Ionicons
          name={icon}
          size={19}
          color={
            variant === "primary"
              ? primaryText
              : theme.palette.textPrimary
          }
        />
      ) : null}

      <Text
        style={[
          styles.buttonText,
          {
            color:
              variant === "primary"
                ? primaryText
                : theme.palette.textPrimary,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type GatewayProviderButtonProps = {
  label: string;
  meta: string;
  icon?: IconName;
  brand?: ProviderBrand;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
};

export function GatewayProviderButton({
  label,
  meta,
  icon,
  brand,
  onPress,
  disabled = false,
  loading = false,
}: GatewayProviderButtonProps) {
  const { selectedThemeId, theme } = useDashboardTheme();
  const accent =
    selectedThemeId === "royal_gold_cosmos"
      ? theme.palette.gold
      : theme.palette.royal;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.providerButton,
        {
          backgroundColor: theme.palette.surfaceRaised,
          borderColor: theme.palette.borderStrong,
          opacity:
            disabled || loading
              ? 0.5
              : pressed
                ? 0.82
                : 1,
        },
      ]}
    >
      <View
        style={[
          styles.providerIcon,
          {
            borderColor:
              brand === "google"
                ? "#DADCE0"
                : brand === "apple"
                  ? "rgba(255,255,255,0.24)"
                  : theme.palette.border,
            backgroundColor:
              brand === "google"
                ? "#FFFFFF"
                : brand === "apple"
                  ? "#000000"
                  : "transparent",
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={accent} />
        ) : brand === "google" ? (
          <Image
            accessibilityIgnoresInvertColors
            source={GOOGLE_G}
            resizeMode="contain"
            style={styles.googleProviderIcon}
          />
        ) : brand === "apple" ? (
          <Ionicons
            name="logo-apple"
            size={22}
            color="#FFFFFF"
          />
        ) : icon ? (
          <Ionicons
            name={icon}
            size={20}
            color={theme.palette.textPrimary}
          />
        ) : null}
      </View>

      <View style={styles.providerCopy}>
        <Text
          style={[
            styles.providerLabel,
            { color: theme.palette.textPrimary },
          ]}
        >
          {label}
        </Text>
        <Text
          style={[
            styles.providerMeta,
            {
              color: disabled
                ? theme.palette.textTertiary
                : accent,
            },
          ]}
        >
          {meta}
        </Text>
      </View>

      <Ionicons
        name="arrow-forward-outline"
        size={18}
        color={theme.palette.textTertiary}
      />
    </Pressable>
  );
}

export function GatewayDivider({ label }: { label: string }) {
  const { theme } = useDashboardTheme();

  return (
    <View style={styles.dividerRow}>
      <View
        style={[
          styles.dividerLine,
          { backgroundColor: theme.palette.border },
        ]}
      />
      <Text
        style={[
          styles.dividerText,
          { color: theme.palette.textTertiary },
        ]}
      >
        {label}
      </Text>
      <View
        style={[
          styles.dividerLine,
          { backgroundColor: theme.palette.border },
        ]}
      />
    </View>
  );
}

type NoticeTone = "neutral" | "error" | "success";

export function GatewayNotice({
  title,
  body,
  tone = "neutral",
}: {
  title: string;
  body?: string;
  tone?: NoticeTone;
}) {
  const { selectedThemeId, theme } = useDashboardTheme();

  const themeAccent =
    selectedThemeId === "royal_gold_cosmos"
      ? theme.palette.gold
      : theme.palette.royal;

  const color =
    tone === "error"
      ? theme.palette.negative
      : tone === "success"
        ? theme.palette.positive
        : themeAccent;

  const backgroundColor =
    tone === "error"
      ? theme.palette.negativeSoft
      : tone === "success"
        ? theme.palette.positiveSoft
        : theme.palette.surfaceRaised;

  const icon: IconName =
    tone === "error"
      ? "alert-circle-outline"
      : tone === "success"
        ? "checkmark-circle-outline"
        : "shield-checkmark-outline";

  return (
    <View
      style={[
        styles.notice,
        {
          backgroundColor,
          borderColor: color,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={color}
      />
      <View style={styles.noticeCopy}>
        <Text
          style={[
            styles.noticeTitle,
            { color: theme.palette.textPrimary },
          ]}
        >
          {title}
        </Text>
        {body ? (
          <Text
            style={[
              styles.noticeBody,
              { color: theme.palette.textSecondary },
            ]}
          >
            {body}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldBlock: {
    gap: 7,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  fieldFrame: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  fieldIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: "700",
    backgroundColor: "transparent",
  },
  revealButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "900",
  },
  providerButton: {
    minHeight: 62,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  providerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  googleProviderIcon: {
    width: 22,
    height: 22,
  },
  providerCopy: {
    flex: 1,
    gap: 2,
  },
  providerLabel: {
    fontSize: 14,
    fontWeight: "900",
  },
  providerMeta: {
    fontSize: 11,
    fontWeight: "800",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  notice: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  noticeCopy: {
    flex: 1,
    gap: 4,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: "900",
  },
  noticeBody: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
});
