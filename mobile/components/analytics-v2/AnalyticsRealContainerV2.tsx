import React, {
  useMemo,
  useState,
} from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import AnalyticsCommandCenterV2 from "./AnalyticsCommandCenterV2";
import RoyalCosmosBackground from "../ui/RoyalCosmosBackground";

import { useAppointmentsData } from "../../hooks/useResourceData";
import { useSession } from "../../hooks/useSession";
import { useAppPreferences } from "../../hooks/useAppPreferences";

import {
  buildRealAnalyticsPeriodModels,
} from "./analytics-v2-real-calculations";

import {
  localizeRealAnalyticsPeriodModels,
} from "./analytics-v2-localize-real-model";

import {
  analyticsV2T,
  type AnalyticsV2Key,
  type AnalyticsV2Params,
} from "./analytics-v2-i18n";

const DAY_MS =
  24 * 60 * 60 * 1000;

function StatusView({
  title,
  subtitle,
  tone = "violet",
  onRetry,
  retryLabel = "Retry live analytics",
}: {
  title: string;
  subtitle: string;
  tone?: "violet" | "rose";
  onRetry?: () => void;
  retryLabel?: string;
}) {
  const error = tone === "rose";

  return (
    <RoyalCosmosBackground
      style={styles.root}
    >
      <View style={styles.statusRoot}>
        <View style={styles.statusCard}>
          <View
            style={[
              styles.statusIcon,
              error &&
                styles.statusIconError,
            ]}
          >
            <Ionicons
              name={
                error
                  ? "warning-outline"
                  : "analytics-outline"
              }
              size={29}
              color={
                error
                  ? "#FF6B8A"
                  : "#8C7CFF"
              }
            />
          </View>

          <Text style={styles.statusTitle}>
            {title}
          </Text>

          <Text
            style={styles.statusSubtitle}
          >
            {subtitle}
          </Text>

          {onRetry ? (
            <Pressable
              accessibilityRole="button"
              onPress={onRetry}
              style={styles.retryButton}
            >
              <Ionicons
                name="refresh-outline"
                size={17}
                color="#FFFFFF"
              />

              <Text style={styles.retryText}>
                {retryLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </RoyalCosmosBackground>
  );
}

export default function AnalyticsRealContainerV2() {
  const {
    token,
    booting,
    clearToken,
  } = useSession();

  const {
    locale,
    currency,
  } = useAppPreferences();

  const tr = (
    key: AnalyticsV2Key,
    params?: AnalyticsV2Params
  ) =>
    analyticsV2T(
      locale,
      key,
      params
    );

  const [historyStart] =
    useState(() =>
      new Date(
        Date.now() -
          180 * DAY_MS
      ).toISOString()
    );

  const [
    generatedAt,
    setGeneratedAt,
  ] = useState(() => Date.now());

  const queryOptions = useMemo(
    () => ({
      dateFrom: historyStart,
      limit: 2000,
    }),
    [historyStart]
  );

  const appointmentsState =
    useAppointmentsData(
      token,
      clearToken,
      queryOptions
    );

  const rawPeriodModels = useMemo(
    () =>
      buildRealAnalyticsPeriodModels({
        appointments:
          appointmentsState.appointments,
        clients:
          appointmentsState.clients,
        services:
          appointmentsState.services,
        currency,
        locale,
        generatedAt,
      }),
    [
      appointmentsState.appointments,
      appointmentsState.clients,
      appointmentsState.services,
      currency,
      locale,
      generatedAt,
    ]
  );

  const periodModels = useMemo(
    () =>
      localizeRealAnalyticsPeriodModels(
        rawPeriodModels,
        locale
      ),
    [
      rawPeriodModels,
      locale,
    ]
  );

  const refresh = () => {
    setGeneratedAt(Date.now());
    appointmentsState.refresh();
  };

  if (booting) {
    return (
      <StatusView
        title={tr(
          "container.preparingTitle"
        )}
        subtitle={tr(
          "container.preparingSubtitle"
        )}
      />
    );
  }

  if (!token) {
    return (
      <StatusView
        title={tr(
          "container.authTitle"
        )}
        subtitle={tr(
          "container.authSubtitle"
        )}
      />
    );
  }

  if (appointmentsState.loading) {
    return (
      <StatusView
        title={tr(
          "container.loadingTitle"
        )}
        subtitle={tr(
          "container.loadingSubtitle"
        )}
      />
    );
  }

  if (appointmentsState.error) {
    return (
      <StatusView
        title={tr(
          "container.errorTitle"
        )}
        subtitle={
          appointmentsState.error
        }
        tone="rose"
        onRetry={refresh}
        retryLabel={tr(
          "container.retry"
        )}
      />
    );
  }

  return (
    <AnalyticsCommandCenterV2
      model={periodModels["30d"]}
      periodModels={periodModels}
      dataMode="live"
      refreshing={
        appointmentsState.refreshing
      }
      onRefresh={refresh}
    />
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  statusRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  statusCard: {
    width: "100%",
    maxWidth: 560,
    alignItems: "center",
    padding: 28,
    borderRadius: 25,
    borderWidth: 1,
    borderColor:
      "rgba(140,124,255,0.25)",
    backgroundColor:
      "rgba(13,19,36,0.97)",
  },
  statusIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(140,124,255,0.14)",
  },
  statusIconError: {
    backgroundColor:
      "rgba(255,107,138,0.14)",
  },
  statusTitle: {
    color: "#F7F8FF",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 18,
  },
  statusSubtitle: {
    color: "#AAB3CA",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 8,
  },
  retryButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 17,
    borderRadius: 13,
    backgroundColor: "#8C7CFF",
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },
});
