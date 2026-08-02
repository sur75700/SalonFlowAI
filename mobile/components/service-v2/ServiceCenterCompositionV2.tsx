import React from "react";
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Polyline } from "react-native-svg";

import RoyalCosmosBackground from "../ui/RoyalCosmosBackground";
import type { ServiceItem } from "../../types/models";

export type ServiceFilterKey =
  "all" | "popular" | "active" | "inactive";

export type ServiceFormValuesV2 = {
  name: string;
  duration_minutes: string;
  price: string;
  currency: string;
  is_active: boolean;
};

export type ServiceFormErrorsV2 = Partial<
  Record<keyof ServiceFormValuesV2, string>
>;

export type ServiceKpiV2 = {
  label: string;
  value: string;
  hint?: string;
};

export type ServiceMetricV2 = {
  ready: boolean;
  bookingsWeek: number;
  revenueWeekLabel: string;
  demandPercent: number;
  trend: number[];
  popular: boolean;
};

type ServiceVisualV2 = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  accent: string;
  soft: string;
  border: string;
  glow: string;
};

const DEFAULT_SERVICE_VISUAL: ServiceVisualV2 = {
  icon: "sparkles-outline",
  accent: "#A7B4FF",
  soft: "rgba(116, 126, 255, 0.24)",
  border: "rgba(167, 180, 255, 0.30)",
  glow: "rgba(116, 126, 255, 0.15)",
};

function resolveServiceVisual(
  serviceName: string | null | undefined
): ServiceVisualV2 {
  const name = (serviceName || "").toLocaleLowerCase();

  const includesAny = (terms: string[]) =>
    terms.some((term) => name.includes(term));

  if (
    includesAny([
      "bridal",
      "bride",
      "wedding",
      "հարս",
      "свад",
      "невест",
      "mariée",
      "mariage",
    ])
  ) {
    return {
      icon: "diamond-outline",
      accent: "#FFD976",
      soft: "rgba(255, 201, 91, 0.22)",
      border: "rgba(255, 217, 118, 0.36)",
      glow: "rgba(255, 193, 77, 0.16)",
    };
  }

  if (
    includesAny([
      "makeup",
      "make-up",
      "դիմահարդ",
      "макияж",
      "maquillage",
    ])
  ) {
    return {
      icon: "color-palette-outline",
      accent: "#FF7AC3",
      soft: "rgba(255, 90, 165, 0.22)",
      border: "rgba(255, 122, 195, 0.34)",
      glow: "rgba(255, 79, 163, 0.15)",
    };
  }

  if (
    includesAny([
      "nail",
      "manicure",
      "pedicure",
      "եղունգ",
      "մատնահարդ",
      "ногт",
      "маникюр",
      "педикюр",
      "ongle",
    ])
  ) {
    return {
      icon: "hand-left-outline",
      accent: "#FF8A9E",
      soft: "rgba(255, 101, 129, 0.22)",
      border: "rgba(255, 138, 158, 0.34)",
      glow: "rgba(255, 96, 128, 0.15)",
    };
  }

  if (
    includesAny([
      "brow",
      "lash",
      "eyebrow",
      "lamination",
      "հոնք",
      "թարթիչ",
      "бров",
      "ресниц",
      "sourcil",
      "cil",
    ])
  ) {
    return {
      icon: "eye-outline",
      accent: "#64DFFF",
      soft: "rgba(76, 201, 240, 0.21)",
      border: "rgba(100, 223, 255, 0.34)",
      glow: "rgba(64, 202, 255, 0.14)",
    };
  }

  if (
    includesAny([
      "facial",
      "face",
      "skin",
      "glow",
      "դեմք",
      "մաշկ",
      "лиц",
      "кож",
      "visage",
      "peau",
      "soin",
    ])
  ) {
    return {
      icon: "sparkles-outline",
      accent: "#55F2C1",
      soft: "rgba(61, 224, 179, 0.20)",
      border: "rgba(85, 242, 193, 0.34)",
      glow: "rgba(45, 226, 174, 0.14)",
    };
  }

  if (
    includesAny([
      "massage",
      "spa",
      "relax",
      "մերս",
      "սպա",
      "массаж",
      "спа",
    ])
  ) {
    return {
      icon: "leaf-outline",
      accent: "#84E6A5",
      soft: "rgba(82, 199, 119, 0.21)",
      border: "rgba(132, 230, 165, 0.34)",
      glow: "rgba(84, 213, 127, 0.14)",
    };
  }

  if (
    includesAny([
      "wax",
      "epilat",
      "մազահեռ",
      "воск",
      "эпиляц",
      "épilat",
    ])
  ) {
    return {
      icon: "flame-outline",
      accent: "#FFB45E",
      soft: "rgba(255, 159, 67, 0.22)",
      border: "rgba(255, 180, 94, 0.35)",
      glow: "rgba(255, 151, 55, 0.15)",
    };
  }

  if (
    includesAny([
      "hair",
      "balayage",
      "coloring",
      "colour",
      "keratin",
      "blow",
      "haircut",
      "մազ",
      "գունավորում",
      "վարս",
      "волос",
      "стриж",
      "уклад",
      "окраш",
      "кератин",
      "балаяж",
      "cheveu",
      "coiff",
      "coloration",
      "kératine",
    ])
  ) {
    return {
      icon: "cut-outline",
      accent: "#A68BFF",
      soft: "rgba(124, 92, 255, 0.24)",
      border: "rgba(166, 139, 255, 0.36)",
      glow: "rgba(124, 92, 255, 0.16)",
    };
  }

  return DEFAULT_SERVICE_VISUAL;
}

export type ServiceFilterOptionV2 = {
  key: ServiceFilterKey;
  label: string;
  count: number;
};

type Labels = {
  addService: string;
  searchPlaceholder: string;
  retry: string;
  serviceName: string;
  duration: string;
  price: string;
  currency: string;
  active: string;
  inactive: string;
  edit: string;
  delete: string;
  save: string;
  cancel: string;
  close: string;
  create: string;
  creating: string;
  working: string;
  popular: string;
  bookingsWeek: string;
  revenueWeek: string;
  demand: string;
  weeklyPerformance: string;
  emptyTitle: string;
  emptySubtitle: string;
  errorTitle: string;
  createTitle: string;
  createSubtitle: string;
};

type SheetFormProps = {
  values: ServiceFormValuesV2;
  errors?: ServiceFormErrorsV2;
  labels: Labels;
  disabled?: boolean;
  onChangeField: (
    field: keyof ServiceFormValuesV2,
    value: string | boolean
  ) => void;
};

type Props = {
  overline: string;
  title: string;
  subtitle: string;
  labels: Labels;

  kpis: ServiceKpiV2[];
  filters: ServiceFilterOptionV2[];
  activeFilter: ServiceFilterKey;
  onFilterChange: (filter: ServiceFilterKey) => void;

  searchValue: string;
  onSearchChange: (value: string) => void;

  services: ServiceItem[];
  serviceMetrics: Record<string, ServiceMetricV2>;
  formatPrice: (service: ServiceItem) => string;

  loading: boolean;
  refreshing: boolean;
  error?: string | null;
  workingId?: string;

  onRefresh: () => void;
  onRetry: () => void;
  onOpenCreate: () => void;
  onOpenService: (service: ServiceItem) => void;

  createSheet: {
    visible: boolean;
    values: ServiceFormValuesV2;
    errors?: ServiceFormErrorsV2;
    loading?: boolean;
    onChangeField: SheetFormProps["onChangeField"];
    onSubmit: () => void;
    onClose: () => void;
  };

  detailSheet: {
    visible: boolean;
    service: ServiceItem | null;
    metrics: ServiceMetricV2 | null;
    mode: "view" | "edit";
    values: ServiceFormValuesV2;
    errors?: ServiceFormErrorsV2;
    loading?: boolean;
    priceLabel: string;
    onChangeField: SheetFormProps["onChangeField"];
    onRequestEdit: () => void;
    onSave: () => void;
    onDelete: () => void;
    onCancelEdit: () => void;
    onClose: () => void;
  };
};

function ActionPill({
  label,
  icon,
  onPress,
  tone = "primary",
  disabled = false,
  style,
}: {
  label: string;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  tone?: "primary" | "purple" | "secondary" | "danger";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionPill,
        tone === "primary" && styles.actionPrimary,
        tone === "purple" && styles.actionPurple,
        tone === "secondary" && styles.actionSecondary,
        tone === "danger" && styles.actionDanger,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={16}
          color={tone === "primary" ? "#171b3f" : "#f3f4ff"}
        />
      ) : null}
      <Text
        style={[
          styles.actionText,
          tone === "primary" && styles.actionPrimaryText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function FormField({
  label,
  value,
  error,
  keyboardType,
  autoCapitalize,
  disabled,
  onChangeText,
}: {
  label: string;
  value: string;
  error?: string;
  keyboardType?: "default" | "number-pad" | "decimal-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  disabled?: boolean;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <TextInput
        editable={!disabled}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholderTextColor="#777fa8"
        style={[
          styles.fieldInput,
          error && styles.fieldInputError,
          disabled && styles.disabled,
        ]}
      />

      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

function ServiceForm({
  values,
  errors,
  labels,
  disabled,
  onChangeField,
}: SheetFormProps) {
  return (
    <>
      <FormField
        label={labels.serviceName}
        value={values.name}
        error={errors?.name}
        disabled={disabled}
        autoCapitalize="words"
        onChangeText={(value) => onChangeField("name", value)}
      />

      <View style={styles.formRow}>
        <View style={styles.formColumn}>
          <FormField
            label={labels.duration}
            value={values.duration_minutes}
            error={errors?.duration_minutes}
            disabled={disabled}
            keyboardType="number-pad"
            onChangeText={(value) =>
              onChangeField("duration_minutes", value)
            }
          />
        </View>

        <View style={styles.formColumn}>
          <FormField
            label={labels.price}
            value={values.price}
            error={errors?.price}
            disabled={disabled}
            keyboardType="decimal-pad"
            onChangeText={(value) => onChangeField("price", value)}
          />
        </View>
      </View>

      <FormField
        label={labels.currency}
        value={values.currency}
        error={errors?.currency}
        disabled={disabled}
        autoCapitalize="characters"
        onChangeText={(value) =>
          onChangeField("currency", value.toUpperCase())
        }
      />

      <Text style={styles.fieldLabel}>{labels.active}</Text>

      <View style={styles.statusSelector}>
        <Pressable
          disabled={disabled}
          onPress={() => onChangeField("is_active", true)}
          style={[
            styles.statusChoice,
            values.is_active && styles.statusChoiceActive,
          ]}
        >
          <View style={[styles.statusDot, styles.statusDotActive]} />
          <Text style={styles.statusChoiceText}>{labels.active}</Text>
        </Pressable>

        <Pressable
          disabled={disabled}
          onPress={() => onChangeField("is_active", false)}
          style={[
            styles.statusChoice,
            !values.is_active && styles.statusChoiceInactive,
          ]}
        >
          <View style={[styles.statusDot, styles.statusDotInactive]} />
          <Text style={styles.statusChoiceText}>{labels.inactive}</Text>
        </Pressable>
      </View>
    </>
  );
}

function SheetShell({
  visible,
  title,
  subtitle,
  tone = "default",
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  tone?: "default" | "purple";
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityLabel="Close"
          onPress={onClose}
          style={[StyleSheet.absoluteFillObject, styles.backdrop]}
        />

        <View
          style={[
            styles.sheet,
            tone === "purple" && styles.sheetPurple,
          ]}
        >
          {tone === "purple" ? (
            <>
              <View
                pointerEvents="none"
                style={styles.sheetPurpleGlowTop}
              />
              <View
                pointerEvents="none"
                style={styles.sheetPurpleGlowBottom}
              />
            </>
          ) : null}

          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderCopy}>
              <Text style={styles.sheetTitle}>{title}</Text>
              {subtitle ? (
                <Text style={styles.sheetSubtitle}>{subtitle}</Text>
              ) : null}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color="#dfe2ff" />
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            showsVerticalScrollIndicator
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetContent}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ServiceSparkline({
  values,
}: {
  values: number[];
}) {
  const width = 104;
  const height = 38;
  const normalizedValues =
    values.length >= 2 ? values : [0, 0, 0, 0];

  const maximum = Math.max(...normalizedValues, 1);
  const minimum = Math.min(...normalizedValues, 0);
  const span = Math.max(maximum - minimum, 1);

  const points = normalizedValues
    .map((value, index) => {
      const x =
        (index / (normalizedValues.length - 1)) * width;
      const y =
        height -
        3 -
        ((value - minimum) / span) * (height - 7);

      return `${x},${y}`;
    })
    .join(" ");

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      <Polyline
        points={points}
        fill="none"
        stroke="#20E59A"
        strokeWidth={11}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.20}
      />

      <Polyline
        points={points}
        fill="none"
        stroke="#36F5A8"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
</Svg>
  );
}

function ServiceCard({
  service,
  metrics,
  labels,
  priceTitle,
  priceValue,
  durationLabel,
  activeLabel,
  inactiveLabel,
  disabled,
  wide,
  onPress,
}: {
  service: ServiceItem;
  metrics?: ServiceMetricV2;
  labels: Labels;
  priceTitle: string;
  priceValue: string;
  durationLabel: string;
  activeLabel: string;
  inactiveLabel: string;
  disabled?: boolean;
  wide: boolean;
  onPress: () => void;
}) {
  const visual = resolveServiceVisual(service.name);
  const metricsReady = Boolean(metrics?.ready);

  const bookingsValue = metricsReady
    ? String(metrics?.bookingsWeek ?? 0)
    : "—";

  const revenueValue = metricsReady
    ? metrics?.revenueWeekLabel || "—"
    : "—";

  const demandValue = metricsReady
    ? `${metrics?.demandPercent ?? 0}%`
    : "—";

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.serviceCard,
        { borderColor: visual.border },
        wide ? styles.serviceCardWide : styles.serviceCardFull,
        pressed && !disabled && styles.cardPressed,
        disabled && styles.disabled,
      ]}
    >


      <View
        pointerEvents="none"
        style={[
          styles.serviceVisualBar,
          { backgroundColor: visual.accent },
        ]}
      />



      <View style={styles.serviceCardTop}>
        <View
          style={[
            styles.serviceIcon,
            {
              backgroundColor: visual.soft,
              borderColor: visual.border,
            },
          ]}
        >
          <Ionicons
            name={visual.icon}
            size={23}
            color={visual.accent}
          />
        </View>

        <View style={styles.cardBadgeRow}>
          {metrics?.popular ? (
            <View style={styles.popularBadge}>
              <Ionicons
                name="flame"
                size={12}
                color="#f7d76f"
              />
              <Text style={styles.popularBadgeText}>
                {labels.popular}
              </Text>
            </View>
          ) : null}

          <View
            style={[
              styles.statusPill,
              service.is_active
                ? styles.statusPillActive
                : styles.statusPillInactive,
            ]}
          >
            <View
              style={[
                styles.statusSmallDot,
                service.is_active
                  ? styles.statusDotActive
                  : styles.statusDotInactive,
              ]}
            />

            <Text style={styles.statusPillText}>
              {service.is_active ? activeLabel : inactiveLabel}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.serviceName} numberOfLines={2}>
        {service.name || "—"}
      </Text>

      <View style={styles.primaryMetrics}>
        <View style={styles.primaryMetric}>
          <Text style={styles.metricLabel}>{priceTitle}</Text>
          <Text style={styles.metricValue}>{priceValue}</Text>
        </View>

        <View style={[styles.primaryMetric, styles.metricAlignRight]}>
          <Text style={styles.metricLabel}>{durationLabel}</Text>
          <Text style={styles.metricValue}>
            {service.duration_minutes ?? 0}
          </Text>
        </View>
      </View>

      <View style={styles.intelligenceGrid}>
        <View style={styles.intelligenceMetric}>
          <Text style={styles.metricLabel}>
            {labels.bookingsWeek}
          </Text>
          <Text style={styles.intelligenceValue}>
            {bookingsValue}
          </Text>
        </View>

        <View style={styles.intelligenceMetric}>
          <Text style={styles.metricLabel}>
            {labels.revenueWeek}
          </Text>
          <Text
            style={styles.intelligenceValue}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {revenueValue}
          </Text>
        </View>

        <View style={styles.intelligenceMetric}>
          <Text style={styles.metricLabel}>
            {labels.demand}
          </Text>
          <Text style={styles.intelligenceValue}>
            {demandValue}
          </Text>
        </View>
      </View>

      <View style={styles.trendPanel}>
        <View style={styles.trendCopy}>
          <Text style={styles.metricLabel}>
            {labels.weeklyPerformance}
          </Text>
          <Text style={styles.trendHint}>
            {metricsReady ? demandValue : "—"}
          </Text>
        </View>

        <ServiceSparkline
          values={metrics?.trend ?? [0, 0, 0, 0]}
        />
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.cardLine} />
        <Ionicons
          name="chevron-forward"
          size={17}
          color="rgba(221,225,255,0.55)"
        />
      </View>
    </Pressable>
  );
}

export default function ServiceCenterCompositionV2({
  overline,
  title,
  subtitle,
  labels,
  kpis,
  filters,
  activeFilter,
  onFilterChange,
  searchValue,
  onSearchChange,
  services,
  serviceMetrics,
  formatPrice,
  loading,
  refreshing,
  error,
  workingId,
  onRefresh,
  onRetry,
  onOpenCreate,
  onOpenService,
  createSheet,
  detailSheet,
}: Props) {
  const { width } = useWindowDimensions();
  const wide = width >= 760;

  const selectedVisual = detailSheet.service
    ? resolveServiceVisual(detailSheet.service.name)
    : DEFAULT_SERVICE_VISUAL;

  return (
    <RoyalCosmosBackground style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#f4d47d"
          />
        }
        contentContainerStyle={[
          styles.content,
          wide && styles.contentWide,
        ]}
      >
        <View style={styles.hero}>
          <View style={styles.heroGlow} />

          <View style={styles.heroHeader}>
            <View style={styles.heroCopy}>
              <Text style={styles.overline}>{overline}</Text>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>

            <ActionPill
              label={labels.addService}
              icon="add"
              tone="purple"
              onPress={onOpenCreate}
            />
          </View>
        </View>

        <View style={styles.kpiGrid}>
          {kpis.map((kpi, index) => (
            <View
              key={`${kpi.label}-${index}`}
              style={[
                styles.kpiCard,
                index === 0 && {
                  backgroundColor: "#4B3FA0",
                  borderColor: "#8C7CFF",
                  opacity: 1,
                },
                index === 1 && {
                  backgroundColor: "#087A5B",
                  borderColor: "#45E5B2",
                  opacity: 1,
                },
                index === 2 && {
                  backgroundColor: "#A43E5B",
                  borderColor: "#FF829E",
                  opacity: 1,
                },
                index === 3 && {
                  backgroundColor: "#B87500",
                  borderColor: "#FFD064",
                  opacity: 1,
                },
                wide ? styles.kpiWide : styles.kpiMobile,
              ]}
            >
              <View
                style={[
                  styles.kpiIcon,
                  index === 0 && styles.kpiIconTotal,
                  index === 1 && styles.kpiIconActive,
                  index === 2 && styles.kpiIconInactive,
                  index === 3 && styles.kpiIconDuration,
                ]}
              >
                <Ionicons
                  name={
                    index === 0
                      ? "layers-outline"
                      : index === 1
                        ? "sparkles-outline"
                        : index === 2
                          ? "pause-circle-outline"
                          : "time-outline"
                  }
                  size={19}
                  color={
                    index === 0
                      ? "#C5B8FF"
                      : index === 1
                        ? "#5CFFC0"
                        : index === 2
                          ? "#FF91A5"
                          : "#FFD678"
                  }
                />
              </View>

              <Text style={styles.kpiLabel}>{kpi.label}</Text>
              <Text style={styles.kpiValue}>{kpi.value}</Text>

              {kpi.hint ? (
                <Text style={styles.kpiHint}>{kpi.hint}</Text>
              ) : null}
            </View>
          ))}
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <View style={styles.errorIcon}>
              <Ionicons
                name="alert-circle-outline"
                size={20}
                color="#ffbdc7"
              />
            </View>

            <View style={styles.errorCopy}>
              <Text style={styles.errorTitle}>{labels.errorTitle}</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>

            <ActionPill
              label={labels.retry}
              onPress={onRetry}
              tone="secondary"
            />
          </View>
        ) : null}

        <View style={styles.controlsCard}>
          <View style={styles.searchWrap}>
            <Ionicons
              name="search"
              size={18}
              color="#8e97c6"
              style={styles.searchIcon}
            />

            <TextInput
              value={searchValue}
              onChangeText={onSearchChange}
              placeholder={labels.searchPlaceholder}
              placeholderTextColor="#8088b2"
              style={styles.searchInput}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
          >
            {filters.map((filter) => {
              const active = filter.key === activeFilter;

              return (
                <Pressable
                  key={filter.key}
                  onPress={() => onFilterChange(filter.key)}
                  style={[
                    styles.filterChip,
                    active && styles.filterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      active && styles.filterTextActive,
                    ]}
                  >
                    {filter.label}
                  </Text>

                  <View
                    style={[
                      styles.filterCount,
                      active && styles.filterCountActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterCountText,
                        active && styles.filterCountTextActive,
                      ]}
                    >
                      {filter.count}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.serviceGrid}>
            {[0, 1, 2, 3].map((item) => (
              <View
                key={item}
                style={[
                  styles.skeletonCard,
                  wide
                    ? styles.serviceCardWide
                    : styles.serviceCardFull,
                ]}
              >
                <View style={styles.skeletonIcon} />
                <View style={styles.skeletonTitle} />
                <View style={styles.skeletonLine} />
                <View style={styles.skeletonLineShort} />
              </View>
            ))}
          </View>
        ) : services.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="cut-outline"
                size={28}
                color="#cdd2ff"
              />
            </View>

            <Text style={styles.emptyTitle}>{labels.emptyTitle}</Text>
            <Text style={styles.emptySubtitle}>
              {labels.emptySubtitle}
            </Text>

            <ActionPill
              label={labels.addService}
              icon="add"
              tone="purple"
              onPress={onOpenCreate}
              style={styles.emptyAction}
            />
          </View>
        ) : (
          <View style={styles.serviceGrid}>
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                metrics={serviceMetrics[service.id]}
                labels={labels}
                priceTitle={labels.price}
                priceValue={formatPrice(service)}
                durationLabel={labels.duration}
                activeLabel={labels.active}
                inactiveLabel={labels.inactive}
                disabled={workingId === service.id}
                wide={wide}
                onPress={() => onOpenService(service)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <SheetShell
        visible={createSheet.visible}
        tone="purple"
        title={labels.createTitle}
        subtitle={labels.createSubtitle}
        onClose={createSheet.onClose}
      >
        <ServiceForm
          values={createSheet.values}
          errors={createSheet.errors}
          labels={labels}
          disabled={createSheet.loading}
          onChangeField={createSheet.onChangeField}
        />

        <View style={styles.sheetActions}>
          <ActionPill
            label={
              createSheet.loading
                ? labels.creating
                : labels.create
            }
            icon="add"
            tone="purple"
            disabled={createSheet.loading}
            onPress={createSheet.onSubmit}
            style={styles.flexAction}
          />

          <ActionPill
            label={labels.cancel}
            tone="secondary"
            disabled={createSheet.loading}
            onPress={createSheet.onClose}
          />
        </View>
      </SheetShell>

      <SheetShell
        visible={detailSheet.visible}
        title={detailSheet.service?.name || title}
        subtitle={
          detailSheet.service
            ? detailSheet.service.is_active
              ? labels.active
              : labels.inactive
            : undefined
        }
        onClose={detailSheet.onClose}
      >
        {detailSheet.service && detailSheet.mode === "view" ? (
          <>
            <View style={styles.detailHero}>
              <View
                style={[
                  styles.detailIcon,
                  {
                    backgroundColor: selectedVisual.soft,
                    borderColor: selectedVisual.border,
                  },
                ]}
              >
                <Ionicons
                  name={selectedVisual.icon}
                  size={29}
                  color={selectedVisual.accent}
                />
              </View>

              <View style={styles.detailHeroCopy}>
                <Text style={styles.detailName}>
                  {detailSheet.service.name}
                </Text>

                <View
                  style={[
                    styles.statusPill,
                    detailSheet.service.is_active
                      ? styles.statusPillActive
                      : styles.statusPillInactive,
                  ]}
                >
                  <View
                    style={[
                      styles.statusSmallDot,
                      detailSheet.service.is_active
                        ? styles.statusDotActive
                        : styles.statusDotInactive,
                    ]}
                  />

                  <Text style={styles.statusPillText}>
                    {detailSheet.service.is_active
                      ? labels.active
                      : labels.inactive}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.detailMetrics}>
              <View style={styles.detailMetric}>
                <Text style={styles.metricLabel}>{labels.price}</Text>
                <Text style={styles.detailMetricValue}>
                  {detailSheet.priceLabel}
                </Text>
              </View>

              <View style={styles.detailMetric}>
                <Text style={styles.metricLabel}>
                  {labels.duration}
                </Text>
                <Text style={styles.detailMetricValue}>
                  {detailSheet.service.duration_minutes ?? 0}
                </Text>
              </View>

              <View style={styles.detailMetric}>
                <Text style={styles.metricLabel}>
                  {labels.currency}
                </Text>
                <Text style={styles.detailMetricValue}>
                  {detailSheet.service.currency || "—"}
                </Text>
              </View>
            </View>

            <View style={styles.detailPerformance}>
              <View style={styles.detailPerformanceHeader}>
                <View>
                  <Text style={styles.metricLabel}>
                    {labels.weeklyPerformance}
                  </Text>
                  <Text style={styles.detailPerformanceRevenue}>
                    {detailSheet.metrics?.ready
                      ? detailSheet.metrics.revenueWeekLabel
                      : "—"}
                  </Text>
                </View>

                <ServiceSparkline
                  values={
                    detailSheet.metrics?.trend ??
                    [0, 0, 0, 0]
                  }
                />
              </View>

              <View style={styles.detailPerformanceStats}>
                <View style={styles.detailPerformanceStat}>
                  <Text style={styles.metricLabel}>
                    {labels.bookingsWeek}
                  </Text>
                  <Text style={styles.detailPerformanceValue}>
                    {detailSheet.metrics?.ready
                      ? detailSheet.metrics.bookingsWeek
                      : "—"}
                  </Text>
                </View>

                <View style={styles.detailPerformanceStat}>
                  <Text style={styles.metricLabel}>
                    {labels.demand}
                  </Text>
                  <Text style={styles.detailPerformanceValue}>
                    {detailSheet.metrics?.ready
                      ? `${detailSheet.metrics.demandPercent}%`
                      : "—"}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.sheetActions}>
              <ActionPill
                label={labels.edit}
                icon="create-outline"
                disabled={detailSheet.loading}
                onPress={detailSheet.onRequestEdit}
                style={styles.flexAction}
              />

              <ActionPill
                label={
                  detailSheet.loading
                    ? labels.working
                    : labels.delete
                }
                icon="trash-outline"
                tone="danger"
                disabled={detailSheet.loading}
                onPress={detailSheet.onDelete}
              />
            </View>
          </>
        ) : detailSheet.service ? (
          <>
            <ServiceForm
              values={detailSheet.values}
              errors={detailSheet.errors}
              labels={labels}
              disabled={detailSheet.loading}
              onChangeField={detailSheet.onChangeField}
            />

            <View style={styles.sheetActions}>
              <ActionPill
                label={
                  detailSheet.loading
                    ? labels.working
                    : labels.save
                }
                icon="checkmark"
                disabled={detailSheet.loading}
                onPress={detailSheet.onSave}
                style={styles.flexAction}
              />

              <ActionPill
                label={labels.cancel}
                tone="secondary"
                disabled={detailSheet.loading}
                onPress={detailSheet.onCancelEdit}
              />
            </View>
          </>
        ) : null}
      </SheetShell>
    </RoyalCosmosBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#040508",
  },
  content: {
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 120,
  },
  contentWide: {
    maxWidth: 1080,
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  hero: {
    overflow: "hidden",
    borderRadius: 30,
    padding: 22,
    marginBottom: 16,
    backgroundColor: "rgba(24, 30, 72, 0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    shadowColor: "#000000",
    shadowOpacity: 0.34,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
  },
  heroGlow: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 240,
    right: -90,
    top: -125,
    backgroundColor: "rgba(123, 92, 246, 0.20)",
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
  },
  heroCopy: {
    flex: 1,
  },
  overline: {
    color: "#f4d47d",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2.2,
    marginBottom: 9,
  },
  title: {
    color: "#ffffff",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    marginBottom: 6,
  },
  subtitle: {
    color: "rgba(215,219,255,0.62)",
    fontSize: 13,
    lineHeight: 19,
  },
  actionPill: {
    minHeight: 44,
    borderRadius: 24,
    paddingHorizontal: 17,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderWidth: 1,
  },
  actionPrimary: {
    backgroundColor: "#f4f5ff",
    borderColor: "#ffffff",
    shadowColor: "#6c63ff",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 5,
  },
  actionPurple: {
    backgroundColor: "#8C7CFF",
    borderColor: "rgba(197, 190, 255, 0.82)",
    shadowColor: "#8C7CFF",
    shadowOpacity: 0.48,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  actionSecondary: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.11)",
  },
  actionDanger: {
    backgroundColor: "rgba(244,63,94,0.10)",
    borderColor: "rgba(251,113,133,0.30)",
  },
  actionText: {
    color: "#f3f4ff",
    fontSize: 13,
    fontWeight: "800",
  },
  actionPrimaryText: {
    color: "#171b3f",
  },
  pressed: {
    transform: [{ scale: 0.975 }],
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.5,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    minHeight: 126,
    borderRadius: 24,
    padding: 16,
    backgroundColor: "rgba(28, 35, 83, 0.78)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  kpiCardTotal: {
    backgroundColor: "rgba(68, 51, 138, 0.78)",
    borderColor: "rgba(166, 139, 255, 0.28)",
  },
  kpiCardActive: {
    backgroundColor: "rgba(20, 91, 76, 0.72)",
    borderColor: "rgba(92, 255, 192, 0.27)",
  },
  kpiCardInactive: {
    backgroundColor: "rgba(102, 40, 61, 0.70)",
    borderColor: "rgba(255, 145, 165, 0.27)",
  },
  kpiCardDuration: {
    backgroundColor: "rgba(105, 76, 25, 0.72)",
    borderColor: "rgba(255, 214, 120, 0.28)",
  },
  kpiIconTotal: {
    backgroundColor: "rgba(166, 139, 255, 0.18)",
  },
  kpiIconActive: {
    backgroundColor: "rgba(92, 255, 192, 0.15)",
  },
  kpiIconInactive: {
    backgroundColor: "rgba(255, 145, 165, 0.15)",
  },
  kpiIconDuration: {
    backgroundColor: "rgba(255, 214, 120, 0.16)",
  },
  kpiMobile: {
    width: "48%",
    flexGrow: 1,
  },
  kpiWide: {
    width: "23%",
    flexGrow: 1,
  },
  kpiIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(131,140,255,0.15)",
    marginBottom: 13,
  },
  kpiLabel: {
    color: "rgba(199,204,244,0.55)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  kpiValue: {
    color: "#ffffff",
    fontSize: 23,
    lineHeight: 28,
    fontWeight: "900",
  },
  kpiHint: {
    color: "rgba(199,204,244,0.48)",
    fontSize: 11,
    marginTop: 4,
  },
  errorCard: {
    borderRadius: 22,
    padding: 15,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(82, 24, 46, 0.82)",
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.28)",
  },
  errorIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(251,113,133,0.10)",
  },
  errorCopy: {
    flex: 1,
  },
  errorTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 3,
  },
  errorText: {
    color: "#ffccd5",
    fontSize: 12,
    lineHeight: 17,
  },
  controlsCard: {
    borderRadius: 24,
    padding: 14,
    marginBottom: 16,
    backgroundColor: "rgba(20, 26, 65, 0.78)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  searchWrap: {
    height: 48,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(7, 11, 32, 0.62)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 12,
  },
  searchIcon: {
    marginLeft: 15,
    marginRight: 9,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    paddingRight: 14,
    color: "#ffffff",
    fontSize: 14,
  },
  filters: {
    gap: 8,
    paddingRight: 4,
  },
  filterChip: {
    minHeight: 38,
    borderRadius: 20,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  filterChipActive: {
    backgroundColor: "#eef0ff",
    borderColor: "#ffffff",
  },
  filterText: {
    color: "rgba(220,224,255,0.70)",
    fontSize: 12,
    fontWeight: "800",
  },
  filterTextActive: {
    color: "#171b3f",
  },
  filterCount: {
    minWidth: 21,
    height: 21,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  filterCountActive: {
    backgroundColor: "rgba(23,27,63,0.09)",
  },
  filterCountText: {
    color: "rgba(220,224,255,0.66)",
    fontSize: 10,
    fontWeight: "900",
  },
  filterCountTextActive: {
    color: "#171b3f",
  },
  serviceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "stretch",
    gap: 14,
  },
  serviceCard: {
    minHeight: 330,
    borderRadius: 26,
    padding: 17,
    backgroundColor: "rgba(27, 34, 80, 0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    shadowColor: "#000000",
    shadowOpacity: 0.24,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 7,
  },
  serviceCardFull: {
    width: "100%",
  },
  serviceCardWide: {
    width: "48.8%",
    flexGrow: 1,
  },
  cardPressed: {
    transform: [{ translateY: -2 }, { scale: 0.995 }],
    borderColor: "rgba(255,255,255,0.18)",
  },
  serviceVisualBar: {
    position: "absolute",
    top: 0,
    left: 24,
    right: 24,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    opacity: 0.88,
  },
  serviceCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(119, 94, 246, 0.38)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  statusPill: {
    minHeight: 27,
    borderRadius: 14,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
  },
  statusPillActive: {
    backgroundColor: "rgba(45,212,191,0.10)",
    borderColor: "rgba(45,212,191,0.22)",
  },
  statusPillInactive: {
    backgroundColor: "rgba(148,163,184,0.09)",
    borderColor: "rgba(148,163,184,0.20)",
  },
  statusSmallDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotActive: {
    backgroundColor: "#2dd4bf",
  },
  statusDotInactive: {
    backgroundColor: "#94a3b8",
  },
  statusPillText: {
    color: "#e5e8ff",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  serviceName: {
    color: "#ffffff",
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900",
    marginBottom: 22,
  },
  serviceMetrics: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  metricAlignRight: {
    alignItems: "flex-end",
  },
  metricLabel: {
    color: "rgba(188,194,236,0.52)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  metricValue: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: "auto",
    paddingTop: 22,
  },
  cardLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  emptyCard: {
    borderRadius: 28,
    padding: 32,
    alignItems: "center",
    backgroundColor: "rgba(24,30,72,0.76)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(129,140,248,0.16)",
    marginBottom: 16,
  },
  emptyTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 7,
  },
  emptySubtitle: {
    color: "rgba(207,212,251,0.55)",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    maxWidth: 420,
  },
  emptyAction: {
    marginTop: 18,
  },
  skeletonCard: {
    minHeight: 210,
    borderRadius: 26,
    padding: 17,
    backgroundColor: "rgba(27,34,80,0.62)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  skeletonIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.07)",
    marginBottom: 24,
  },
  skeletonTitle: {
    width: "62%",
    height: 20,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 22,
  },
  skeletonLine: {
    width: "100%",
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginBottom: 10,
  },
  skeletonLineShort: {
    width: "55%",
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  modalRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  backdrop: {
    backgroundColor: "rgba(2, 4, 14, 0.74)",
  },
  sheet: {
    width: "100%",
    maxWidth: 560,
    maxHeight: "88%",
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "rgba(18, 23, 58, 0.99)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    shadowColor: "#000000",
    shadowOpacity: 0.52,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 24 },
    elevation: 24,
  },
  sheetPurple: {
    backgroundColor: "rgba(43, 31, 91, 0.99)",
    borderColor: "rgba(140, 124, 255, 0.52)",
    shadowColor: "#8C7CFF",
    shadowOpacity: 0.46,
    shadowRadius: 46,
    shadowOffset: { width: 0, height: 22 },
    elevation: 26,
  },
  sheetPurpleGlowTop: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 280,
    top: -175,
    right: -95,
    backgroundColor: "rgba(140, 124, 255, 0.25)",
  },
  sheetPurpleGlowBottom: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 240,
    bottom: -175,
    left: -105,
    backgroundColor: "rgba(101, 78, 220, 0.18)",
  },
  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.17)",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 12,
    gap: 12,
  },
  sheetHeaderCopy: {
    flex: 1,
  },
  sheetTitle: {
    color: "#ffffff",
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "900",
  },
  sheetSubtitle: {
    color: "rgba(205,210,250,0.54)",
    fontSize: 12,
    marginTop: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  sheetScroll: {
    flexShrink: 1,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 22,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    color: "rgba(202,207,246,0.60)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 7,
  },
  fieldInput: {
    minHeight: 48,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: "#ffffff",
    fontSize: 14,
    backgroundColor: "rgba(7,11,31,0.62)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  fieldInputError: {
    borderColor: "rgba(251,113,133,0.70)",
  },
  fieldError: {
    color: "#ffb4c2",
    fontSize: 11,
    marginTop: 6,
  },
  formRow: {
    flexDirection: "row",
    gap: 12,
  },
  formColumn: {
    flex: 1,
  },
  statusSelector: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  statusChoice: {
    flex: 1,
    minHeight: 44,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  statusChoiceActive: {
    backgroundColor: "rgba(45,212,191,0.10)",
    borderColor: "rgba(45,212,191,0.25)",
  },
  statusChoiceInactive: {
    backgroundColor: "rgba(148,163,184,0.10)",
    borderColor: "rgba(148,163,184,0.24)",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusChoiceText: {
    color: "#eef0ff",
    fontSize: 12,
    fontWeight: "800",
  },
  sheetActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 6,
  },
  flexAction: {
    flex: 1,
  },
  detailHero: {
    borderRadius: 22,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    marginBottom: 14,
  },
  detailIcon: {
    width: 54,
    height: 54,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(119,94,246,0.42)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  detailHeroCopy: {
    flex: 1,
    alignItems: "flex-start",
    gap: 7,
  },
  detailName: {
    color: "#ffffff",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
  },
  detailMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  detailMetric: {
    flex: 1,
    minWidth: 120,
    borderRadius: 19,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  detailMetricValue: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  cardBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 7,
    flexShrink: 1,
  },
  popularBadge: {
    minHeight: 27,
    borderRadius: 14,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(247, 215, 111, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(247, 215, 111, 0.28)",
  },
  popularBadgeText: {
    color: "#f7d76f",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  primaryMetrics: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 18,
  },
  primaryMetric: {
    flex: 1,
  },
  intelligenceGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  intelligenceMetric: {
    flex: 1,
    minHeight: 76,
    borderRadius: 17,
    paddingHorizontal: 10,
    paddingVertical: 11,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  intelligenceValue: {
    color: "#ffffff",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "900",
  },
  trendPanel: {
    minHeight: 68,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    backgroundColor: "rgba(8, 13, 38, 0.40)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  trendCopy: {
    flex: 1,
  },
  trendHint: {
    color: "#5CFFC0",
    fontSize: 12,
    fontWeight: "900",
  },
  detailPerformance: {
    borderRadius: 21,
    padding: 15,
    marginBottom: 16,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  detailPerformanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    marginBottom: 14,
  },
  detailPerformanceRevenue: {
    color: "#ffffff",
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900",
  },
  detailPerformanceStats: {
    flexDirection: "row",
    gap: 10,
  },
  detailPerformanceStat: {
    flex: 1,
    minHeight: 62,
    borderRadius: 16,
    padding: 11,
    backgroundColor: "rgba(7,11,31,0.42)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  detailPerformanceValue: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },

});
