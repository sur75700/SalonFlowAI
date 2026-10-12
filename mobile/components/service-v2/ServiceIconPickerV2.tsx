import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useDashboardTheme } from "../../hooks/useDashboardTheme";
import { useAppPreferences } from "../../hooks/useAppPreferences";

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
  { key: "car_wash", icon: "water-outline", label: "Car Wash" },
  { key: "detailing", icon: "car-sport-outline", label: "Detailing" },
  { key: "interior", icon: "car-outline", label: "Interior" },
  { key: "ceramic", icon: "shield-checkmark-outline", label: "Ceramic" },
  { key: "paint", icon: "color-palette-outline", label: "Paint" },
  { key: "polish", icon: "sparkles-outline", label: "Polish" },
  { key: "tint", icon: "layers-outline", label: "Tint" },
  { key: "wheels", icon: "disc-outline", label: "Wheels" },
  { key: "engine", icon: "construct-outline", label: "Engine" },
  { key: "protection", icon: "shield-outline", label: "Protection" },
] as const;

const SERVICE_ICON_COPY = {
  en: {
    eyebrow: "SERVICE ICON",
    helper: "Choose a premium symbol clients will recognize instantly.",
  },
  hy: {
    eyebrow: "ԾԱՌԱՅՈՒԹՅԱՆ ՊԱՏԿԵՐԱԿ",
    helper: "Ընտրեք պրեմիում պատկերակ, որը հաճախորդը միանգամից կճանաչի։",
  },
  ru: {
    eyebrow: "ИКОНКА УСЛУГИ",
    helper: "Выберите премиальный символ, который клиент узнает сразу.",
  },
  fr: {
    eyebrow: "ICÔNE DU SERVICE",
    helper: "Choisissez un symbole premium immédiatement reconnaissable.",
  },
} as const;

const SERVICE_ICON_LABELS: Record<string, Record<string, string>> = {
  auto: { en: "Automatic", hy: "Ավտոմատ", ru: "Авто", fr: "Auto" },
  haircut: { en: "Haircut", hy: "Սանրվածք", ru: "Стрижка", fr: "Coupe" },
  styling: { en: "Styling", hy: "Հարդարում", ru: "Укладка", fr: "Coiffage" },
  color: { en: "Color", hy: "Ներկում", ru: "Окрашивание", fr: "Coloration" },
  makeup: { en: "Makeup", hy: "Դիմահարդարում", ru: "Макияж", fr: "Maquillage" },
  nails: { en: "Nails", hy: "Եղունգներ", ru: "Ногти", fr: "Ongles" },
  brows: { en: "Brows", hy: "Հոնքեր", ru: "Брови", fr: "Sourcils" },
  facial: { en: "Facial", hy: "Դեմքի խնամք", ru: "Лицо", fr: "Soin visage" },
  spa: { en: "Spa", hy: "Սպա", ru: "Спа", fr: "Spa" },
  massage: { en: "Massage", hy: "Մերսում", ru: "Массаж", fr: "Massage" },
  bridal: { en: "Bridal", hy: "Հարսանեկան", ru: "Свадебное", fr: "Mariage" },
  waxing: { en: "Waxing", hy: "Դեպիլյացիա", ru: "Воск", fr: "Épilation" },
  laser: { en: "Laser", hy: "Լազեր", ru: "Лазер", fr: "Laser" },
  barber: { en: "Barber", hy: "Բարբեր", ru: "Барбер", fr: "Barbier" },
  wellness: { en: "Wellness", hy: "Վելնես", ru: "Велнес", fr: "Bien-être" },
  premium: { en: "Premium", hy: "Պրեմիում", ru: "Премиум", fr: "Premium" },
  kids: { en: "Kids", hy: "Երեխաներ", ru: "Дети", fr: "Enfants" },
  body: { en: "Body", hy: "Մարմին", ru: "Тело", fr: "Corps" },
  skincare: { en: "Skincare", hy: "Մաշկի խնամք", ru: "Уход за кожей", fr: "Peau" },
  car_wash: { en: "Car Wash", hy: "Ավտոլվացում", ru: "Автомойка", fr: "Lavage auto" },
  detailing: { en: "Detailing", hy: "Դիթեյլինգ", ru: "Детейлинг", fr: "Detailing" },
  interior: { en: "Interior", hy: "Սրահ", ru: "Салон авто", fr: "Intérieur" },
  ceramic: { en: "Ceramic", hy: "Կերամիկա", ru: "Керамика", fr: "Céramique" },
  paint: { en: "Paint", hy: "Ներկ", ru: "Краска", fr: "Peinture" },
  polish: { en: "Polish", hy: "Փայլեցում", ru: "Полировка", fr: "Polissage" },
  tint: { en: "Tint", hy: "Մգեցում", ru: "Тонировка", fr: "Teinte" },
  wheels: { en: "Wheels", hy: "Անիվներ", ru: "Колёса", fr: "Roues" },
  engine: { en: "Engine", hy: "Շարժիչ", ru: "Двигатель", fr: "Moteur" },
  protection: { en: "Protection", hy: "Պաշտպանություն", ru: "Защита", fr: "Protection" },
};

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
  const { locale } = useAppPreferences();
  const language = ["en", "hy", "ru", "fr"].includes(locale)
    ? locale
    : "en";
  const copy = SERVICE_ICON_COPY[language as keyof typeof SERVICE_ICON_COPY];
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
          {copy.eyebrow}
        </Text>
        <Text
          style={[
            styles.helper,
            { color: theme.palette.textSecondary },
          ]}
        >
          {copy.helper}
        </Text>
      </View>

      <View style={styles.grid}>
        {SERVICE_ICON_OPTIONS.map((option) => {
          const selected = value === option.key;
          const labelKey = option.key || "auto";
          const localizedLabel =
            SERVICE_ICON_LABELS[labelKey]?.[language] ?? option.label;

          return (
            <Pressable
              key={option.key || "auto"}
              accessibilityRole="button"
              accessibilityLabel={`${copy.eyebrow}: ${localizedLabel}`}
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
                {localizedLabel}
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
    width: 92,
    minHeight: 86,
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
